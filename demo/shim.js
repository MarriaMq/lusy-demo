/* Демо-режим: API емулюється прямо в браузері, сервера немає.
   Дзеркалить devserver.py. Нумерологія рахується справжнім пакетом numerology/
   у Pyodide (Python у браузері), решта — дані з window.__DEMO__. */
(function(){
  var D = window.__DEMO__, qs = new URLSearchParams(location.search);
  var state = D.scenarios[qs.get('state')] ? qs.get('state') : 'fresh';
  var S = JSON.parse(JSON.stringify(D.scenarios[state]));
  var lang = qs.get('lang');
  if(['uk','en','ru'].indexOf(lang) >= 0) S.user.lang = lang;
  if(S.subscription.expires_at){
    var d = new Date(); d.setDate(d.getDate() + (S.subscription.plan === 'year' ? 365 : 30));
    S.subscription.expires_at = d.toISOString().slice(0, 19);
  }
  var native = window.fetch.bind(window);

  function J(obj, code){
    return Promise.resolve(new Response(JSON.stringify(obj), {
      status: code || 200, headers: {'Content-Type': 'application/json'}}));
  }
  function planKey(){ return S.subscription.plan === null ? 'null' : S.subscription.plan; }
  function allowed(){ return D.access[planKey()] || D.access['null']; }
  function hist(mod){
    var items = D.history.filter(function(h){ return !mod || h.module === mod; });
    return (state === 'new' || state === 'fresh') ? [] : items;
  }

  /* ── Pyodide: вантажиться у фоні, перший розрахунок чекає на нього ── */
  var pyP = null;
  function getPy(){
    if(pyP) return pyP;
    pyP = new Promise(function(res, rej){
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
      s.onerror = function(){ rej(new Error('pyodide load failed')); };
      s.onload = function(){
        window.loadPyodide().then(function(py){
          return native('demo/numerology.json').then(function(r){ return r.json(); }).then(function(files){
            Object.keys(files).forEach(function(p){
              var full = '/home/pyodide/' + p, dir = full.slice(0, full.lastIndexOf('/'));
              py.FS.mkdirTree(dir); py.FS.writeFile(full, files[p]);
            });
            py.runPython('import sys\nsys.path.insert(0,"/home/pyodide")\nimport demo_api');
            res(py);
          });
        }).catch(rej);
      };
      document.head.appendChild(s);
    });
    return pyP;
  }
  window.addEventListener('load', function(){ setTimeout(function(){ getPy().catch(function(){}); }, 1200); });

  function numerology(method, path, query, body){
    return getPy().then(function(py){
      var fn = py.pyimport('demo_api').handle;
      var out = JSON.parse(fn(method, path, JSON.stringify(query), JSON.stringify(body), S.user.birthdate || ''));
      return J(out[1], out[0]);
    }).catch(function(){
      return J({ok: false, code: 'demo_engine', error: 'Не вдалося завантажити розрахунковий рушій демо. Перевір інтернет і онови сторінку.'}, 500);
    });
  }

  function route(url, opts){
    var u = new URL(url, location.href), p = u.pathname.replace(/^.*?(\/api\/)/, '/api/');
    var method = ((opts && opts.method) || 'GET').toUpperCase();
    var q = {}; u.searchParams.forEach(function(v, k){ q[k] = v; });
    var body = {};
    try{ body = (opts && opts.body) ? JSON.parse(opts.body) : {}; }catch(e){}

    if(p.indexOf('/api/numerology/') === 0) return numerology(method, p, q, body);

    if(method === 'GET'){
      if(p === '/api/profile') return J({ok: true, profile_complete: S.profile_complete, user: S.user,
        subscription: S.subscription, usage: S.usage, strategies_count: S.strategies_count});
      if(p === '/api/usage') return J({ok: true, usage: S.usage});
      if(p === '/api/subscription') return J({ok: true, subscription: S.subscription, usage: S.usage});
      if(p === '/api/module/access'){
        var mod = q.module || 'strategy', h = D.history.filter(function(x){ return x.module === mod; });
        var hasSub = S.subscription.active, left = S.usage.deep_left;
        var hasQuota = left === null || left > 0, modAllowed = allowed().indexOf(mod) >= 0;
        var canGen = modAllowed && (hasQuota || D.quotaFree.indexOf(mod) >= 0);
        return J({ok: true, has_history: h.length > 0 && state !== 'new' && state !== 'fresh',
          history_count: h.length, history: h, can_generate: canGen, module_allowed: modAllowed,
          has_subscription: hasSub, demo_expired: !hasSub && !hasQuota, usage: S.usage});
      }
      if(p === '/api/strategies') return J({ok: true, items: hist(q.module)});
      var m = p.match(/^\/api\/strategies\/(\d+)$/);
      if(m) return J({ok: true, result: D.sampleMd, id: parseInt(m[1], 10)});
      return J({ok: false, error: 'not found'}, 404);
    }

    if(p === '/api/profile/update'){
      if('lang' in body){
        var c = String(body.lang || '').toLowerCase();
        if(['uk','en','ru'].indexOf(c) < 0) return J({ok: false, code: 'unsupported_lang', error: 'Unsupported language'}, 400);
        body.lang = c;
      }
      Object.keys(body).forEach(function(k){ if(k in S.user) S.user[k] = body[k]; });
      S.profile_complete = true;
      return J({ok: true, user: S.user});
    }
    if(p === '/api/profile/lang'){
      var l = String(body.lang || '').toLowerCase();
      if(['uk','en','ru'].indexOf(l) < 0) return J({ok: false, code: 'unsupported_lang', error: 'Unsupported language'}, 400);
      S.user.lang = l; return J({ok: true, user: {id: 424242, lang: l}});
    }
    if(p === '/api/profile/niche'){ S.user.niche = body.niche; return J({ok: true, niche: S.user.niche}); }
    if(p === '/api/subscription/request'){
      /* Демо: оплата «проходить» одразу — активуємо обраний тариф. */
      var plans = {'1month': [1, '1 місяць'], '6months': [6, '6 місяців'], 'year': [12, '12 місяців']};
      var pl = plans[body.tariff] || plans['1month'], lim = 30 * pl[0];
      var e = new Date(); e.setMonth(e.getMonth() + pl[0]);
      S.subscription = {plan: body.tariff in plans ? body.tariff : '1month', active: true,
        plan_name: pl[1], expires_at: e.toISOString().slice(0, 19)};
      S.usage = {deep_used: 0, short_used: 0, deep_left: lim, short_left: lim * 3, deep_limit: lim, short_limit: lim * 3};
      return J({ok: true, payment_url: '', order_reference: 'DEMO'});
    }
    if(p === '/api/generate'){
      var module = body.module || 'strategy';
      if(allowed().indexOf(module) < 0) return J({ok: false, code: 'module_locked', module_locked: true,
        error: 'Модуль «' + (D.moduleNames[module] || module) + '» недоступний на твоєму тарифі.'}, 403);
      if(S.usage.deep_limit !== null && (S.usage.deep_left || 0) <= 0){
        if(!S.subscription.active) return J({ok: false, code: 'demo_expired', demo_expired: true,
          error: 'Безкоштовний розбір уже витрачено. Обери період доступу, щоб продовжити.'}, 402);
        return J({ok: false, code: 'limit_reached', error: 'Ліміт розборів вичерпано.'}, 403);
      }
      S.usage.deep_used += 1; if(S.usage.deep_left !== null) S.usage.deep_left -= 1;
      return new Promise(function(r){ setTimeout(function(){ r(J({ok: true, result: D.sampleMd, strategy_id: 1, usage: S.usage})); }, 900); }).then(function(x){ return x; });
    }
    if(p === '/api/followup'){
      if(S.usage.short_limit !== null && (S.usage.short_left || 0) <= 0)
        return J({ok: false, code: 'short_limit_reached', error: 'Ліміт уточнень вичерпано.'}, 403);
      S.usage.short_used += 1; if(S.usage.short_left !== null) S.usage.short_left -= 1;
      return J({ok: true, answer: D.followupMd, usage: S.usage});
    }
    return J({ok: false, error: 'not found'}, 404);
  }

  window.fetch = function(url, opts){
    if(typeof url === 'string' && url.indexOf('/api/') >= 0) return route(url, opts);
    return native(url, opts);
  };
  window.__DEMO_STATE__ = state;
  window.__DEMO_USER__ = S.user;
})();
