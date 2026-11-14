(function(){

/* ─── CONFIG ─── */
var API_BASE = '';  // той самий origin; для локального тесту: 'http://127.0.0.1:8087'

/* ═══════════════════════════════════════════════════
   I18N

   Джерело правди про мову — колонка users.lang на сервері. Тут її не
   вгадують і не кешують у localStorage: /api/profile віддає вже резолвлений
   код, і саме він застосовується ДО першого show(). Через це користувач
   ніколи не бачить спалах української перед перемиканням.

   Українська в словнику відсутня свідомо: вона лежить у розмітці як
   мова-джерело, applyI18n() запам'ятовує оригінал у data-i18n-src і
   повертає його при перемиканні назад. Тобто «uk» неможливо розсинхронити
   з розміткою — його просто нема де продублювати.

   ЩО ЩЕ НЕ ПЕРЕКЛАДЕНО (свідомо, не забуто): тексти питань у потоках
   модулів (стратегія/прогріви/контент/блог/наставник) і варіанти відповідей.
   Це авторська методологія, а не інтерфейс; перекладати її без автора —
   означає мовчки змінити продукт. Відповіді AI при цьому вже приходять
   мовою користувача: prompts/get_prompt додає директиву мови.
   ═══════════════════════════════════════════════════ */

var LANG_DEFAULT = 'uk';
var LANG_LABELS  = { uk: 'Українська', en: 'English', ru: 'Русский' };
var LANG         = LANG_DEFAULT;

/* Прапори — інлайновий SVG, а не емодзі.
   Емодзі-прапор — це пара regional indicator (🇺 + 🇦). Кольоровий гліф для
   такої пари є в шрифтах Apple і Android, але НЕ в Segoe UI Emoji під
   Windows: там пара деградує до двох літер, і користувач бачить «ua English»
   замість прапора. Telegram Desktop показує WebApp у вбудованому Chromium
   під тим самим шрифтом, тож це не крайній випадок, а звичайний десктоп.

   SVG не залежить від шрифта взагалі й виглядає однаково скрізь.
   Значення підставляються в innerHTML БЕЗ escHtml — це константи з цього
   файлу, а не дані користувача; перевіряється тестом у tests/test_copy.py. */
var LANG_FLAGS = {
  uk: '<svg viewBox="0 0 24 16" class="flag-svg" aria-hidden="true">'
    + '<rect width="24" height="16" fill="#005BBB"/>'
    + '<rect y="8" width="24" height="8" fill="#FFD500"/></svg>',
  en: '<svg viewBox="0 0 24 16" class="flag-svg" aria-hidden="true">'
    + '<rect width="24" height="16" fill="#012169"/>'
    + '<path d="M0 0l24 16M24 0L0 16" stroke="#FFF" stroke-width="3.2"/>'
    + '<path d="M0 0l24 16M24 0L0 16" stroke="#C8102E" stroke-width="1.9"/>'
    + '<path d="M12 0v16M0 8h24" stroke="#FFF" stroke-width="5.3"/>'
    + '<path d="M12 0v16M0 8h24" stroke="#C8102E" stroke-width="3.2"/></svg>',
  ru: '<svg viewBox="0 0 24 16" class="flag-svg" aria-hidden="true">'
    + '<rect width="24" height="16" fill="#FFF"/>'
    + '<rect y="5.33" width="24" height="5.34" fill="#0039A6"/>'
    + '<rect y="10.67" width="24" height="5.33" fill="#D52B1E"/></svg>'
};

/* Прапор + назва мови одним HTML-фрагментом. Назва екранується, прапор — ні. */
function langLabelHtml(code){
  return (LANG_FLAGS[code] || '')
       + '<span class="lang-name">' + escHtml(LANG_LABELS[code] || code) + '</span>';
}

var I18N = {
  en: {
    ob_bot_title: 'First,<br><em>let’s get acquainted</em>',
    ob_bot_lede: 'Sign-up happens in the chat with LUSY: your date of birth and phone number — and the app opens right on the home screen.',
    ob_bot_btn: 'Back to the chat',
    /* ── Загальне ── */
    splash_sub: 'mentor',
    btn_back: 'Back',
    btn_save: 'Save',
    btn_close: 'Close',
    btn_close_word: 'Close',
    btn_send: 'Send',
    btn_retry: 'Try again',
    btn_get_access: 'Get access',
    btn_extend: 'Extend access',
    btn_my_analyses: 'My analyses',
    btn_ask_question: 'Ask a question',
    btn_pay: 'Go to payment',
    btn_open_again: 'Open again',

    lbl_demo: 'Demo',
    lbl_analyses: 'Analyses',
    lbl_followups: 'Follow-ups',
    lbl_modules: 'Modules',
    lbl_status: 'Status',
    lbl_valid_until: 'Valid until',
    lbl_used: 'Used',
    lbl_mentor: 'Mentor',

    /* ── Онбординг ── */

    /* ── Реєстрація ── */

    /* Помилки анкети. Ті самі ключі обслуговують і клієнтську перевірку,
       і відмову сервера (див. SERVER_ERR_KEY): дві різні фрази про одну
       причину читались би як два різні збої. */
    err_name_required: 'Enter your name',
    err_phone_required: 'Enter your phone number',
    err_phone_invalid: 'Invalid number. Format: +380XXXXXXXXX',
    err_birth_required: 'Enter the date as DD.MM.YYYY',
    err_birth_format: 'Format: DD.MM.YYYY',
    err_birth_future: 'The date cannot be today or in the future',
    err_birth_too_old: 'The date cannot be more than 150 years ago',
    err_generic: 'Something went wrong, please try again',
    err_network: 'Network error, please try again',
    err_unsupported_lang: 'This language is not supported',
    err_invoice_failed: 'Could not create the invoice',
    err_save_failed: 'Could not save',
    err_loading: 'Loading error',
    err_network_check: 'Network error. Check your connection.',

    /* ── Копіювання, уточнення, шит оплати ── */
    copy_done: 'Copied!',
    copy_toast: 'Result copied',
    copy_btn: 'Copy result',
    copy_failed: 'Could not copy',
    fu_none_left: 'No follow-ups left',
    fu_empty: 'Type your question',
    fu_no_strategy: 'Error: analysis not found',
    pw_info_when: 'Payment opens a day before expiry or when analyses run out.',
    pw_info_left: '<strong>{days} days</strong> and <strong>{deep} analyses</strong> left.',
    pw_info_until: 'Access valid until {date}',

    /* Причини відкриття шита оплати (реєстр ACCESS_REASONS) */
    reason_locked_module: 'This module opens with access.',
    reason_demo_used: 'The free analysis has already been used.',
    reason_limit_reached: 'You have run out of analyses on the current plan.',
    reason_renew: 'A new period is added to the current one.',

    /* ── Екран доступу до модуля ── */
    ma_btn_new: 'Build a new one',
    ma_limit_short: 'Limit reached',
    ma_demo_used_title: 'Free analysis used',
    ma_demo_used_sub: 'You have already used the free analysis. Pick an access period to continue.',
    ma_locked_title: 'Access required',
    ma_limit_title: 'Analysis limit reached',
    ma_limit_sub: 'Used {used} of {limit} analyses on this plan.',

    /* Форми слова для «Знайдено N …». Ключі свідомо не збираються
       статично — вони будуються як 'mod_'+id+'_hist_one'. */
    mod_strategy_hist_one: 'saved strategy',
    mod_strategy_hist_many: 'saved strategies',
    mod_strategy_hist_prev: 'previous strategies',
    mod_warmups_hist_one: 'saved warm-up',
    mod_warmups_hist_many: 'saved warm-ups',
    mod_warmups_hist_prev: 'previous warm-ups',
    mod_content_hist_one: 'saved content system',
    mod_content_hist_many: 'saved content systems',
    mod_content_hist_prev: 'previous content systems',
    mod_blog_hist_one: 'saved analysis',
    mod_blog_hist_many: 'saved analyses',
    mod_blog_hist_prev: 'previous blog analyses',
    mod_mentor_hist_one: 'saved analysis',
    mod_mentor_hist_many: 'saved analyses',
    mod_mentor_hist_prev: 'previous analyses',

    /* ── Головна ── */
    home_greet: 'Hi, ',
    home_sub: 'What shall we explore today?',

    /* Позначки на плитках модулів. Текст, а не іконка: «PRO» без підпису
       читається як рекламний значок, а не як «замкнено». */
    tag_pro: 'PRO',
    tag_free: 'Free',

    /* ── Тарифи ── */
    tar_title: 'My blog',
    tar_pick_btn: 'Choose a plan',
    tar_pick_lbl: 'Choose your access period',
    tar_sub: 'Your blog analysis: situation review, content ideas, niche and sales preparation. Pick a plan and every section opens.',
    tar_have_access: 'Your access is active',
    tar_active_until: 'until {date}',
    tar_active_note_renew: 'The plan you pick will be added to your current access.',
    tar_active_note_wait: 'The plans below are for renewal. Payment opens a day before your access ends, or once you run out of analyses.',
    tar_incl_title: 'What you get after payment?',
    tar_i_numerology: 'Destiny Matrix',
    tar_pick_btn_renew: 'Extend access',
    tar_open_blog: 'Open the sections',
    biz_until: 'Access open until {date}',
    tar_i_mentor: 'Review of my situation',
    tar_i_blog: 'Improving my blog',
    tar_i_content: 'Finding content topics',
    tar_i_strategy: 'Finding my niche and product',
    tar_i_warmups: 'Preparing to sell',
    tar_free_note: '<b>The Destiny Matrix</b> is included too — free, no subscription needed.',
    plan_year: '12 months',
    plan_6months: '6 months',
    plan_1month: '1 month',
    plan_starter: 'Starter',
    /* {sum} підставляє JS: ціни рахуються з TARIFFS, а не пишуться в локалі.
       Через це «економія 395 ₴» не може розійтися з прайсом при зміні цін. */
    tar_saving: 'save {sum} ₴',
    tar_per_month: '{sum} ₴ per month',
    tar_try: 'To try it without commitment',
    tar_per_month_short: '≈ {sum} ₴/mo',
    tar_per_month_short_exact: '{sum} ₴/mo',

    plan_starter_full: 'Starter (7 days)',

    /* Формат дати в .toLocaleDateString — теж частина локалі. */
    date_locale: 'en-GB',

    /* ── Профіль ── */
    prof_title: 'Profile',
    renew_wait: 'Extension becomes available one day before expiry, or once your analyses run out. {days} days left.',
    prof_demo_exp: 'One analysis and a few follow-ups are available.',
    status_no_access: 'no access',
    status_active: 'active',
    niche_title: 'Your niche',
    niche_custom_ph: 'Type your own niche…',
    niche_empty: 'Not set',
    niche_custom_required: 'Type your niche',
    niche_saving: 'Saving\u2026',
    niche_save_btn: 'Save \u2192',
    niche_saved: 'Niche saved: ',
    lang_title: 'Language',
    lang_row_title: 'Language',

    /* ── Про автора ── */
    aut_title: 'About the author',
    aut_sub: 'Who stands behind LUSY\u2019s analyses.',
    aut_role: 'Digital psychologist · numerologist · mentor',
    aut_quote: 'I don’t tell people who to be.<br>I help them see where they lost themselves — and return to their own choice.',
    aut_approach: 'My approach',
    aut_stat_people: 'years of working with people',
    aut_btn_products: 'My services',
    aut_p6: 'Its job is not to give you one more beautiful description. It is to help you ask yourself the right questions, turn the chaos into a clear picture and see the point where your next choice begins.',
    aut_p5: '<strong>LUSY is my approach, carried over into the digital space.</strong>',
    aut_p4: 'It helps you not just find out “what you are like”, but understand why your life looks the way it does right now — and what you can change.',
    aut_p3: 'In my work I combine psychology, numerology and over 15 years of real experience working with people and business.',
    aut_p1: 'It was never enough for me to simply give someone a decoding of their numbers or a one-size-fits-all piece of advice.',
    aut_p2: 'Behind every request I see a whole life script: how a person makes choices, builds relationships, earns, shows up, why they stall and at what moment they lose touch with themselves.',
    aut_stat_years: 'years of practice in psychology and numerology',
    aut_stat_analyses: 'consultations and analyses',

    /* ── Мої розбори ── */
    btn_get_analysis: 'Get an analysis',
    empty_title: 'Your analyses are kept here',
    empty_sub: 'Go through any module — the result stays in your profile and you can come back to it.',

    /* ── Уточнення ── */
    fu_limit_label: 'Follow-ups used',
    fu_show_source: 'Show the analysis',
    fu_input_ph: 'What would you like to clarify?',
    fu_limit_out_title: 'You\u2019ve used up the follow-ups on this plan',
    fu_limit_out_sub: 'Your analyses stay in the profile. To continue the dialogue — choose an access period.',

    /* ── Шит оплати ── */
    pw_title: 'Payment for access',
    pw_sub: 'Choose a plan and get access to the “My blog” section',
    pw_renew_hint: 'The new period is added to the current one after the payment is confirmed.',
    pw_loading_title: 'Preparing the payment',
    pw_loading_sub: 'A few seconds…',
    pw_redirect_title: 'The payment page is open',
    pw_redirect_sub: 'Finish the payment in the WayForPay window. Access switches on automatically.',
    pw_err_title: 'Didn\u2019t work out',
    pw_ok_title: 'Payment successful',
    pw_ok_until: 'Plan “{plan}” is valid until {date}',
    pw_ok_plan: 'Plan “{plan}” activated',
    pw_ok_open: 'Open my blog',
    pw_ok_open_what: 'Now open:',
    btn_home: 'Back to home',

    /* ── Навігація ── */
    nav_home: 'Home',
    nav_plans: 'My blog',
    nav_author: 'Author',
    nav_services: 'Services',

    /* ── Модулі (реєстр MODULES) ── */
    mod_strategy_name: 'Find my niche and product',
    mod_strategy_desc: 'Understand what you can sell, who needs it and how to earn from it.',
    mod_strategy_hist: 'My strategies',
    mod_warmups_name: 'Get ready to sell',
    mod_warmups_desc: 'Get a plan of stories and posts that warm your audience up to buying.',
    mod_warmups_hist: 'My warm-ups',
    mod_content_name: 'Find content topics',
    mod_content_desc: 'Get rubrics, topics and ideas for posts, stories and Reels.',
    mod_content_hist: 'My content systems',
    mod_blog_name: 'Improve my blog',
    mod_blog_desc: 'Find out what to change in your profile, content and positioning.',
    mod_blog_hist: 'My blog analyses',
    mod_mentor_name: 'Sort out my situation',
    mod_mentor_desc: 'Describe what worries you and get specific advice and next steps.',
    mod_mentor_hist: 'My advice',
    mod_numerology_name: 'Calculate the Destiny Matrix',
    mod_numerology_desc: 'Learn about your character, talents, money, relationships and purpose.',
    mod_numerology_hist: 'My matrices',

    /* ── Повідомлення про мову ── */
    lang_saved: 'Language changed',
    lang_save_failed: 'Could not change the language. Try again.',

    /* ── Нумерологія · Матриця долі ──
       Тут лише ІНТЕРФЕЙС. Тлумачення (22 енергії, 25 кармічних хвостів,
       підказки зон) приходять із сервера українською і залишаються
       українськими: вони не перекладені, і про це користувачу прямо
       каже num_lang_note. Мовчазної підстановки немає — є декларація. */
    num_title: 'Destiny Matrix',
    num_title_pair: 'Couple matrix',
    num_you: 'Your matrix',
    num_birthdate: 'Date of birth',
    num_no_birthdate: 'Your profile has no date of birth. Enter it below \u2014 the matrix will be calculated once and your profile will stay unchanged.',
    num_btn_calc: 'Calculate the matrix',
    num_btn_other: 'Calculate for another date',
    num_btn_compat: 'Calculate compatibility',
    num_other_label: 'DD.MM.YYYY',
    num_other_title: 'Enter another date of birth',
    num_calculating: 'Calculating...',
    num_sub_self: 'Matrix for {a}',
    num_lbl_self: 'Matrix for the date',
    num_lbl_pair: 'Couple matrix',
    num_change_short: 'Change',
    num_sub_pair: 'Couple matrix \u00B7 {a} + {b}',
    num_svg_alt: 'Destiny Matrix chart',
    num_hints_show: 'Show hints',
    num_hints_hide: 'Hide hints',
    num_rod_male: 'male ancestral line',
    num_rod_female: 'female ancestral line',
    num_zk_short: 'CZ',
    num_zk_full: 'COMFORT ZONE',
    num_zoom_in: 'Enlarge the chart',
    num_zoom_plus: 'Zoom in',
    num_zoom_minus: 'Zoom out',
    num_years: 'years',
    num_codes_birth: 'Date of birth',
    num_codes_age: 'Age',
    num_codes_male: 'Male line triple code',
    num_codes_female: 'Female line triple code',
    num_codes_power: 'Ancestral power',
    num_codes_inner: 'Inner power code',
    num_change_date: 'Change the date',
    num_pick: 'Pick the block you want to explore',
    num_cat_person: 'Personality',
    num_cat_money: 'Money and self-realisation',
    num_cat_relations: 'Relationships',
    num_cat_karma: 'Karma and purpose',
    num_cat_extra: 'More',
    num_blk_personality: 'Personality archetype',
    num_blk_comfort: 'Comfort zone',
    num_blk_talents: 'Talents',
    num_blk_child_parent: 'Child\u2013parent pattern',
    num_blk_finance: 'Money and material karma',
    num_blk_money_channel: 'Money channel',
    num_blk_profession: 'Profession',
    num_blk_ancestry_male: 'Line of self-realisation',
    num_blk_ancestry_female: 'Line of relationships',
    num_blk_ideal_partner: 'Ideal partner',
    num_blk_relation_channel: 'Relationship channel',
    num_block_numbers: 'Your numbers',
    num_block_no_hint: 'The description of this block is being prepared.',
    num_block_repeated: 'The number repeats inside this block \u2014 its qualities are amplified. We show it once.',
    num_block_aux: 'Supporting numbers',
    num_block_meaning: 'What each number means right here',
    num_block_summary_t: 'In short',
    num_block_summary: 'This block is held by the energies {nums}. Read them together: in the matrix they work as one node, not one after another.',
    num_prog_node: '{l} years',
    num_block_tap: 'Tap a number to see what it means here.',
    num_block_oor: 'The methodology deliberately leaves this number without an interpretation in this block.',
    num_block_disclaimer: 'Important',
    num_energy_n: 'Energy {n}',
    num_block_general: 'General description of the energy; the reading for this block is being prepared.',
    num_consult_text: 'This is a short reading of your result. In a personal consultation we can look in more detail at how these energies show up in your own life, where your resource is and what may be blocking it.',
    num_consult_btn: 'Go deeper with Alina',
    num_consult_msg: 'Hello! I am interested in a personal Matrix consultation. Could you tell me how to book one?',
    biz_tile_name: 'My blog',
    biz_tile_desc: 'Ideas for your profile, content and positioning.',
    mx_name: 'Destiny Matrix',
    mx_desc: 'Character, talents and personal potential',
    mx_cta: 'Calculate my matrix',
    biz_pick: 'Choose what we work on 👇',
    svc_title: 'My services',
    svc_intro: 'I have created several ways of working together so you can pick the one that fits your needs best.',
    svc_pick: 'Choose what interests you right now 👇',
    svc_back: 'Back to my services',
    svc_tile_name: 'My services',
    svc_tile_desc: 'Consultations, learning and support',
    num_forecast_btn: 'Order a forecast for 2027',
    num_club_btn: 'Join the closed club',
    num_club_msg: 'Hello! I would like to join the closed club. Could you tell me how to do it?',
    num_all_btn: 'All services',
    num_forecast_msg: 'Hello! I would like to order a forecast for 2027. Could you tell me how to do it?',
    num_learn_pop_t: '✨ Learn to calculate it yourself',
    num_learn_pop_intro: 'If you want to study numerology on your own and read your own matrix, I have a recorded course for you: “Your Own Numerologist”.',
    num_learn_pop_what_t: '📚 What is in the course?',
    num_learn_pop_what: '• step-by-step video lessons (recorded);|• everything you need to calculate the matrix yourself;|• meanings of arcana 1 to 22 in plain words;|• learn at a convenient time;|• unlimited access to the materials.',
    num_learn_pop_who_t: '💫 Who is this course for?',
    num_learn_pop_who: 'For those who want to understand themselves, their talents, strengths and life tasks through numerology.',
    num_learn_pop_price: '💰 Price: 2999 UAH',
    num_learn_pop_access: '🔓 Access: forever',
    num_learn_pay: 'Buy the course',
    num_learn_title: 'Learning',
    num_learn_soon_t: 'The courses are being prepared',
    num_learn_soon: 'Alina is putting together courses on reading the Destiny Matrix on your own. Until they are out, the quickest way to understand your chart is a personal consultation.',
    num_health_title: 'Health map',
    num_prog_title: 'Forecast',
    num_energies_title: 'Arcana meanings',
    num_energies_sub: 'Tap a number to read what the Arcanum means at its best and at its worst.',
    num_compat_title: 'Compatibility',
    num_compat_sub: 'The couple matrix is built from two full personal matrices \u2014 point by matching point.',
    num_compat_self: 'Your date of birth',
    num_compat_partner: 'The other person\u2019s date of birth',
    num_compat_privacy: 'The other person\u2019s date of birth is used for this calculation only. It is not stored and does not appear in your history.',
    num_compat_go: 'Calculate compatibility',
    num_compat_result: 'The couple matrix is ready',
    num_compat_open: 'Open the couple chart',
    num_sheet_point: 'Position {id} \u00B7 value {v}',
    num_sheet_zones: 'Zones',
    num_sheet_energy: 'Energy',
    num_sheet_no_zone: 'This position does not belong to any zone \u2014 it is read as a standalone energy.',
    num_energy_title: 'Energy {n}',
    num_energy_plus: 'At its best',
    num_energy_minus: 'At its worst',
    num_energy_note: 'Note',
    num_karmic_title: 'Karmic tail',
    num_karmic_open: 'Read the breakdown',
    num_karmic_past: 'Past experience',
    num_karmic_now: 'How it shows up now',
    num_karmic_conflict: 'Inner conflict',
    num_karmic_tasks: 'Tasks',
    num_karmic_questions: 'Questions to ask yourself',
    num_karmic_focus: 'Focus',
    num_purposes: 'Purpose',
    num_purpose_personal: 'Personal',
    num_purpose_social: 'Social',
    num_purpose_spiritual: 'Spiritual',
    num_purpose_planetary: 'Planetary',
    num_purpose_social_male: 'Social \u00B7 male line',
    num_purpose_social_female: 'Social \u00B7 female line',
    num_sky_line: 'Sky chakras',
    num_earth_line: 'Earth chakras',
    num_male_code: 'Triple code of the male line',
    num_female_code: 'Triple code of the female line',
    num_ancestral_power: 'Ancestral power',
    num_inner_power: 'Inner power code',
    num_inner_male: 'male',
    num_inner_female: 'female',
    num_inner_total: 'together',
    num_health_chakra: 'Chakra',
    num_health_physics: 'Physical',
    num_health_energy: 'Energy',
    num_health_emotions: 'Emotions',
    num_health_sum: 'Sum',
    num_health_total: 'Total',
    num_decade: 'years \u00B7 anchor point {p}',
    num_lang_note: 'Interpretations are currently available in Ukrainian only',
    num_legal_esoteric: 'The calculations are informational, educational and reflective in nature. Numerology is a symbolic system of self-knowledge and is not a scientifically validated method of diagnosis or of predicting the future.',
    num_legal_medical: 'The health map, the chakra analysis and the related numbers are not a medical diagnosis. They do not establish the presence of any disease and do not replace an examination, tests, treatment or a doctor\u2019s consultation. Do not stop treatment, change medication or make medical decisions on the basis of a numerological calculation alone.',
    num_legal_prognosis: 'The forecast and the energies of the year show symbolic themes and possible directions of attention, not guaranteed events. The calculation does not guarantee marriage, pregnancy, divorce, financial growth, a change of job, relocation or any other event.',
    num_err_generic: 'Could not calculate the matrix',
    num_err_compat: 'Could not calculate compatibility',
    num_err_energy: 'Could not load the interpretation',
    err_num_partner_format: 'Invalid date format. Use DD.MM.YYYY',
    err_num_energy_range: 'The energy must be a number from 1 to 22',
    err_rate_limited: 'Too many requests. Wait a minute and try again'
  },

  ru: {
    ob_bot_title: 'Сначала<br><em>познакомимся</em>',
    ob_bot_lede: 'Регистрация проходит в чате с LUSY: дата рождения и номер телефона — и приложение сразу откроется на главном экране.',
    ob_bot_btn: 'Вернуться в чат',
    /* ── Загальне ── */
    splash_sub: 'наставник',
    btn_back: 'Назад',
    btn_save: 'Сохранить',
    btn_close: 'Закрыть',
    btn_close_word: 'Закрыть',
    btn_send: 'Отправить',
    btn_retry: 'Попробовать снова',
    btn_get_access: 'Получить доступ',
    btn_extend: 'Продлить доступ',
    btn_my_analyses: 'Мои разборы',
    btn_ask_question: 'Задать вопрос',
    btn_pay: 'Перейти к оплате',
    btn_open_again: 'Открыть снова',

    lbl_demo: 'Демо',
    lbl_analyses: 'Разборы',
    lbl_followups: 'Уточнения',
    lbl_modules: 'Модулей',
    lbl_status: 'Статус',
    lbl_valid_until: 'Действует до',
    lbl_used: 'Использовано',
    lbl_mentor: 'Наставник',

    /* ── Онбординг ── */

    /* ── Реєстрація ── */

    /* Помилки анкети — ті самі ключі для клієнтської перевірки й відмови
       сервера (SERVER_ERR_KEY). */
    err_name_required: 'Введи своё имя',
    err_phone_required: 'Введи номер телефона',
    err_phone_invalid: 'Неверный номер. Формат: +380XXXXXXXXX',
    err_birth_required: 'Введи дату в формате ДД.ММ.ГГГГ',
    err_birth_format: 'Формат: ДД.ММ.ГГГГ',
    err_birth_future: 'Дата не может быть сегодняшней или будущей',
    err_birth_too_old: 'Дата не может быть больше 150 лет назад',
    err_generic: 'Что-то пошло не так, попробуй ещё раз',
    err_network: 'Ошибка сети, попробуй ещё раз',
    err_unsupported_lang: 'Этот язык не поддерживается',
    err_invoice_failed: 'Не удалось создать счёт',
    err_save_failed: 'Не удалось сохранить',
    err_loading: 'Ошибка загрузки',
    err_network_check: 'Ошибка сети. Проверь соединение.',

    /* ── Копіювання, уточнення, шит оплати ── */
    copy_done: 'Скопировано!',
    copy_toast: 'Результат скопирован',
    copy_btn: 'Скопировать результат',
    copy_failed: 'Не удалось скопировать',
    fu_none_left: 'Уточнения закончились',
    fu_empty: 'Напиши свой вопрос',
    fu_no_strategy: 'Ошибка: разбор не найден',
    pw_info_when: 'Оплата открывается за день до окончания или когда закончатся разборы.',
    pw_info_left: 'Осталось <strong>{days} дней</strong> и <strong>{deep} разборов</strong>.',
    pw_info_until: 'Доступ действует до {date}',

    /* Причини відкриття шита оплати (реєстр ACCESS_REASONS) */
    reason_locked_module: 'Этот модуль открывается с доступом.',
    reason_demo_used: 'Бесплатный разбор уже использован.',
    reason_limit_reached: 'На текущем тарифе разборы закончились.',
    reason_renew: 'Новый период добавляется к текущему.',

    /* ── Екран доступу до модуля ── */
    ma_btn_new: 'Разработать новую',
    ma_limit_short: 'Лимит исчерпан',
    ma_demo_used_title: 'Бесплатный разбор использован',
    ma_demo_used_sub: 'Ты уже использовала бесплатный разбор. Выбери период доступа, чтобы продолжить.',
    ma_locked_title: 'Нужен доступ',
    ma_limit_title: 'Лимит разборов исчерпан',
    ma_limit_sub: 'Использовано {used} из {limit} разборов на этом тарифе.',

    /* Форми слова для «Знайдено N …». Ключі будуються як
       'mod_'+id+'_hist_one' і статично не збираються.
       Дві форми (1 / решта) — те саме наближення, що вже діє в українській:
       для 2–4 російська просила б третю форму. Див. renderModAccess. */
    mod_strategy_hist_one: 'сохранённая стратегия',
    mod_strategy_hist_many: 'сохранённых стратегий',
    mod_strategy_hist_prev: 'предыдущие стратегии',
    mod_warmups_hist_one: 'сохранённый прогрев',
    mod_warmups_hist_many: 'сохранённых прогревов',
    mod_warmups_hist_prev: 'предыдущие прогревы',
    mod_content_hist_one: 'сохранённая система контента',
    mod_content_hist_many: 'сохранённых систем контента',
    mod_content_hist_prev: 'предыдущие системы контента',
    mod_blog_hist_one: 'сохранённый анализ',
    mod_blog_hist_many: 'сохранённых анализов',
    mod_blog_hist_prev: 'предыдущие анализы блога',
    mod_mentor_hist_one: 'сохранённый разбор',
    mod_mentor_hist_many: 'сохранённых разборов',
    mod_mentor_hist_prev: 'предыдущие разборы',

    /* ── Головна ── */
    home_greet: 'Привет, ',
    home_sub: 'Что исследуем сегодня?',

    /* Позначки на плитках модулів. Текст, а не іконка: «PRO» без підпису
       читається як рекламний значок, а не як «замкнено». */
    tag_pro: 'PRO',
    tag_free: 'Бесплатно',

    /* ── Тарифи ── */
    tar_title: 'Мой блог',
    tar_pick_btn: 'Выбрать тариф',
    tar_pick_lbl: 'Выбери период доступа',
    tar_sub: 'Анализ твоего блога: разбор ситуации, идеи для контента, ниша и подготовка к продаже. Выбери тариф — и все разделы откроются.',
    tar_have_access: 'Доступ уже активен',
    tar_active_until: 'до {date}',
    tar_active_note_renew: 'Выбранный тариф добавится к текущему доступу.',
    tar_active_note_wait: 'Тарифы ниже — для продления. Оплата откроется за день до окончания или когда закончатся разборы.',
    tar_incl_title: 'Что ты получишь после оплаты?',
    tar_i_numerology: 'Матрица судьбы',
    tar_pick_btn_renew: 'Продлить доступ',
    tar_open_blog: 'Открыть разделы',
    biz_until: 'Доступ открыт до {date}',
    tar_i_mentor: 'Разбор моей ситуации',
    tar_i_blog: 'Улучшение моего блога',
    tar_i_content: 'Поиск тем для контента',
    tar_i_strategy: 'Поиск моей ниши и продукта',
    tar_i_warmups: 'Подготовка к продаже',
    tar_free_note: 'Также сюда входит <b>Матрица судьбы</b> — бесплатно и без подписки.',
    plan_year: '12 месяцев',
    plan_6months: '6 месяцев',
    plan_1month: '1 месяц',
    plan_starter: 'Стартовый',
    /* {sum} підставляє JS: ціни рахуються з TARIFFS, а не пишуться в локалі.
       Через це «экономия 395 ₴» не може розійтися з прайсом при зміні цін. */
    tar_saving: 'экономия {sum} ₴',
    tar_per_month: '{sum} ₴ в месяц',
    tar_try: 'Чтобы попробовать без обязательств',
    tar_per_month_short: '≈ {sum} ₴/мес',
    tar_per_month_short_exact: '{sum} ₴/мес',

    plan_starter_full: 'Стартовый (7 дней)',

    /* Формат дати в .toLocaleDateString — теж частина локалі. */
    date_locale: 'ru-RU',

    /* ── Профіль ── */
    prof_title: 'Профиль',
    renew_wait: 'Продление становится доступным за день до окончания или когда закончатся разборы. Осталось {days} дней.',
    prof_demo_exp: 'Доступен один разбор и несколько уточнений.',
    status_no_access: 'нет доступа',
    status_active: 'активен',
    niche_title: 'Твоя ниша',
    niche_custom_ph: 'Напиши свою нишу…',
    niche_empty: 'Не указана',
    niche_custom_required: 'Напиши свою нишу',
    niche_saving: 'Сохраняем\u2026',
    niche_save_btn: 'Сохранить \u2192',
    niche_saved: 'Ниша сохранена: ',
    lang_title: 'Язык',
    lang_row_title: 'Язык',

    /* ── Про автора ── */
    aut_title: 'Об авторе',
    aut_sub: 'Кто стоит за разборами LUSY.',
    aut_role: 'Цифровой психолог · нумеролог · наставница',
    aut_quote: 'Я не говорю человеку, кем ему быть.<br>Я помогаю увидеть, где он потерял себя — и вернуться к собственному выбору.',
    aut_approach: 'Мой подход',
    aut_stat_people: 'лет работы с людьми',
    aut_btn_products: 'Мои услуги',
    aut_p6: 'Её задача — не дать тебе ещё одну красивую характеристику. А помочь задать себе правильные вопросы, собрать хаос в понятную картину и увидеть точку, с которой начинается твой следующий выбор.',
    aut_p5: '<strong>LUSY — это мой подход, перенесённый в цифровое пространство.</strong>',
    aut_p4: 'Это помогает не просто узнать, «какая ты», а понять, почему твоя жизнь сейчас выглядит именно так — и что ты можешь изменить.',
    aut_p3: 'В своей работе я соединяю психологию, нумерологию и более 15 лет реального опыта работы с людьми и бизнесом.',
    aut_p1: 'Мне всегда было мало просто дать человеку расшифровку его чисел или универсальный совет.',
    aut_p2: 'За каждым запросом я вижу целый жизненный сценарий: как человек выбирает, строит отношения, зарабатывает, проявляется, почему останавливается и в какой момент теряет контакт с собой.',
    aut_stat_years: 'лет практики в психологии и нумерологии',
    aut_stat_analyses: 'консультаций и разборов',

    /* ── Мої розбори ── */
    btn_get_analysis: 'Получить разбор',
    empty_title: 'Здесь хранятся твои разборы',
    empty_sub: 'Пройди любой модуль — результат останется в профиле, и к нему можно будет вернуться.',

    /* ── Уточнення ── */
    fu_limit_label: 'Уточнений использовано',
    fu_show_source: 'Показать разбор',
    fu_input_ph: 'Что хочешь уточнить?',
    fu_limit_out_title: 'Ты израсходовала уточнения на этом тарифе',
    fu_limit_out_sub: 'Твои разборы останутся в профиле. Чтобы продолжить диалог — выбери период доступа.',

    /* ── Шит оплати ── */
    pw_title: 'Оплата доступа',
    pw_sub: 'Выбирай тариф и получай доступ к блоку «Мой блог»',
    pw_renew_hint: 'Новый период добавляется к текущему после подтверждения оплаты.',
    pw_loading_title: 'Готовим оплату',
    pw_loading_sub: 'Несколько секунд…',
    pw_redirect_title: 'Страница оплаты открыта',
    pw_redirect_sub: 'Заверши оплату в окне WayForPay. Доступ включится автоматически.',
    pw_err_title: 'Не получилось',
    pw_ok_title: 'Оплата прошла успешно',
    pw_ok_until: 'Тариф «{plan}» действует до {date}',
    pw_ok_plan: 'Тариф «{plan}» активирован',
    pw_ok_open: 'Открыть мой блог',
    pw_ok_open_what: 'Теперь доступно:',
    btn_home: 'На главную',

    /* ── Навігація ── */
    nav_home: 'Главная',
    nav_plans: 'Мой блог',
    nav_author: 'Автор',
    nav_services: 'Услуги',

    /* ── Модулі (реєстр MODULES) ── */
    mod_strategy_name: 'Найти свою нишу и продукт',
    mod_strategy_desc: 'Пойми, что ты можешь продавать, кому это нужно и как на этом зарабатывать.',
    mod_strategy_hist: 'Мои стратегии',
    mod_warmups_name: 'Подготовиться к продаже',
    mod_warmups_desc: 'Получи план сторис и постов, которые подготовят аудиторию к покупке.',
    mod_warmups_hist: 'Мои прогревы',
    mod_content_name: 'Найти темы для контента',
    mod_content_desc: 'Получи рубрики, темы и идеи для постов, сторис и Reels.',
    mod_content_hist: 'Мои системы контента',
    mod_blog_name: 'Улучшить мой блог',
    mod_blog_desc: 'Узнай, что изменить в профиле, контенте и позиционировании.',
    mod_blog_hist: 'Мои анализы блога',
    mod_mentor_name: 'Разобрать мою ситуацию',
    mod_mentor_desc: 'Опиши, что тебя волнует, и получи конкретные советы и следующие шаги.',
    mod_mentor_hist: 'Мои советы',
    mod_numerology_name: 'Рассчитать Матрицу судьбы',
    mod_numerology_desc: 'Узнай о своём характере, талантах, деньгах, отношениях и предназначении.',
    mod_numerology_hist: 'Мои матрицы',

    /* ── Повідомлення про мову ── */
    lang_saved: 'Язык изменён',
    lang_save_failed: 'Не удалось изменить язык. Попробуй ещё раз.',

    /* ── Нумерологія · Матриця долі ──
       Як і в en: перекладений лише інтерфейс. Тлумачення приходять
       українською, і про це прямо каже num_lang_note. */
    num_title: 'Матрица судьбы',
    num_title_pair: 'Матрица пары',
    num_you: 'Твоя матрица',
    num_birthdate: 'Дата рождения',
    num_no_birthdate: 'В профиле нет даты рождения. Введи её ниже \u2014 матрица посчитается разово, профиль не изменится.',
    num_btn_calc: 'Рассчитать матрицу',
    num_btn_other: 'Рассчитать для другой даты',
    num_btn_compat: 'Рассчитать совместимость',
    num_other_label: 'ДД.ММ.ГГГГ',
    num_other_title: 'Введи другую дату рождения',
    num_calculating: 'Считаем...',
    num_sub_self: 'Матрица по дате {a}',
    num_lbl_self: 'Матрица по дате',
    num_lbl_pair: 'Матрица пары',
    num_change_short: 'Изменить',
    num_sub_pair: 'Матрица пары \u00B7 {a} + {b}',
    num_svg_alt: 'Схема Матрицы судьбы',
    num_hints_show: 'Показать подсказки',
    num_hints_hide: 'Скрыть подсказки',
    num_rod_male: 'линия мужского рода',
    num_rod_female: 'линия женского рода',
    num_zk_short: 'ЗК',
    num_zk_full: 'ЗОНА КОМФОРТА',
    num_zoom_in: 'Увеличить схему',
    num_zoom_plus: 'Увеличить',
    num_zoom_minus: 'Уменьшить',
    num_years: 'лет',
    num_codes_birth: 'Дата рождения',
    num_codes_age: 'Возраст',
    num_codes_male: 'Троичный код мужского рода',
    num_codes_female: 'Троичный код женского рода',
    num_codes_power: 'Родовая сила',
    num_codes_inner: 'Код внутренней силы',
    num_change_date: 'Изменить дату',
    num_pick: 'Выбери блок, который хочешь исследовать',
    num_cat_person: 'Личность',
    num_cat_money: 'Финансы и реализация',
    num_cat_relations: 'Отношения',
    num_cat_karma: 'Карма и предназначение',
    num_cat_extra: 'Дополнительно',
    num_blk_personality: 'Архетип личности',
    num_blk_comfort: 'Зона комфорта',
    num_blk_talents: 'Таланты',
    num_blk_child_parent: 'Детско-родительский сценарий',
    num_blk_finance: 'Финансы и материальная карма',
    num_blk_money_channel: 'Финансовый канал',
    num_blk_profession: 'Профессия',
    num_blk_ancestry_male: 'Линия реализации',
    num_blk_ancestry_female: 'Линия отношений',
    num_blk_ideal_partner: 'Идеальный партнёр',
    num_blk_relation_channel: 'Канал отношений',
    num_block_numbers: 'Твои числа',
    num_block_no_hint: 'Описание этого блока готовится.',
    num_block_repeated: 'Число повторяется в этом блоке \u2014 его качества усилены. Показываем его один раз.',
    num_block_aux: 'Вспомогательные числа',
    num_block_meaning: 'Что означает каждое число именно здесь',
    num_block_summary_t: 'Коротко',
    num_block_summary: 'Этот блок держат энергии {nums}. Читать их стоит вместе: в матрице они работают одним узлом, а не по очереди.',
    num_prog_node: '{l} лет',
    num_block_tap: 'Нажми на число, чтобы увидеть, что оно значит здесь.',
    num_block_oor: 'Методичка сознательно оставляет это число без толкования в этом блоке.',
    num_block_disclaimer: 'Важно',
    num_energy_n: 'Энергия {n}',
    num_block_general: 'Общее описание энергии; зональное толкование готовится.',
    num_consult_text: 'Это краткое толкование твоего результата. На личной консультации мы сможем подробнее разобрать, как эти энергии проявляются именно в твоей жизни, где находится твой ресурс и что может мешать его реализации.',
    num_consult_btn: 'Разобрать подробнее с Алиной',
    num_consult_msg: 'Здравствуйте! Меня заинтересовала личная консультация по разбору Матрицы. Подскажите, пожалуйста, как можно записаться?',
    biz_tile_name: 'Мой блог',
    biz_tile_desc: 'Идеи для профиля, контента и позиционирования.',
    mx_name: 'Матрица судьбы',
    mx_desc: 'Характер, таланты и личный потенциал',
    mx_cta: 'Рассчитать матрицу',
    biz_pick: 'Выбирай, над чем работаем 👇',
    svc_title: 'Мои услуги',
    svc_intro: 'Я создала несколько форматов работы, чтобы ты могла выбрать тот, который лучше всего отвечает твоим потребностям.',
    svc_pick: 'Выбирай, что тебе сейчас интересно 👇',
    svc_back: 'Вернуться к моим услугам',
    svc_tile_name: 'Мои услуги',
    svc_tile_desc: 'Консультации, обучение и поддержка',
    num_forecast_btn: 'Заказать прогностику на 2027 год',
    num_club_btn: 'Вступить в закрытый клуб',
    num_club_msg: 'Здравствуйте! Хочу вступить в закрытый клуб. Подскажите, пожалуйста, как это сделать?',
    num_all_btn: 'Все услуги',
    num_forecast_msg: 'Здравствуйте! Хочу заказать прогностику на 2027 год. Подскажите, пожалуйста, как это сделать?',
    num_learn_pop_t: '✨ Научиться рассчитывать самостоятельно',
    num_learn_pop_intro: 'Если вы хотите самостоятельно изучать нумерологию и разбирать свою матрицу, у меня для вас есть курс в записи «Сам себе нумеролог».',
    num_learn_pop_what_t: '📚 Что будет в курсе?',
    num_learn_pop_what: '• пошаговые видеоуроки в записи;|• вся информация о том, как самостоятельно рассчитать матрицу;|• значения арканов от 1 до 22 простыми словами;|• удобный формат обучения в любое время;|• доступ к материалам без ограничений по времени.',
    num_learn_pop_who_t: '💫 Для кого этот курс?',
    num_learn_pop_who: 'Для тех, кто хочет лучше понять себя, свои таланты, сильные стороны и жизненные задачи через нумерологию.',
    num_learn_pop_price: '💰 Стоимость: 2999 грн',
    num_learn_pop_access: '🔓 Доступ: навсегда',
    num_learn_pay: 'Купить курс',
    num_learn_title: 'Обучение',
    num_learn_soon_t: 'Курсы готовятся',
    num_learn_soon: 'Алина собирает курсы по самостоятельному чтению Матрицы судьбы. Пока они готовятся, быстрее всего разобраться в своей схеме поможет личная консультация.',
    num_health_title: 'Карта здоровья',
    num_prog_title: 'Прогностика',
    num_energies_title: 'Значения Арканов',
    num_energies_sub: 'Нажми на число, чтобы прочитать значение Аркана в плюсе и в минусе.',
    num_compat_title: 'Совместимость',
    num_compat_sub: 'Матрица пары строится из двух полных персональных матриц \u2014 по каждой одноимённой точке отдельно.',
    num_compat_self: 'Твоя дата рождения',
    num_compat_partner: 'Дата рождения второго человека',
    num_compat_privacy: 'Дата рождения второго человека используется только для этого расчёта. Она не сохраняется и не попадает в историю.',
    num_compat_go: 'Рассчитать совместимость',
    num_compat_result: 'Матрица пары готова',
    num_compat_open: 'Открыть схему пары',
    num_sheet_point: 'Позиция {id} \u00B7 значение {v}',
    num_sheet_zones: 'Зоны',
    num_sheet_energy: 'Энергия',
    num_sheet_no_zone: 'Эта позиция не входит ни в одну зону \u2014 она читается как отдельная энергия.',
    num_energy_title: 'Энергия {n}',
    num_energy_plus: 'В плюсе',
    num_energy_minus: 'В минусе',
    num_energy_note: 'Примечание',
    num_karmic_title: 'Кармический хвост',
    num_karmic_open: 'Прочитать разбор',
    num_karmic_past: 'Прошлый опыт',
    num_karmic_now: 'Как проявляется сейчас',
    num_karmic_conflict: 'Внутренний конфликт',
    num_karmic_tasks: 'Задачи',
    num_karmic_questions: 'Вопросы к себе',
    num_karmic_focus: 'Фокус',
    num_purposes: 'Предназначение',
    num_purpose_personal: 'Личное',
    num_purpose_social: 'Социальное',
    num_purpose_spiritual: 'Духовное',
    num_purpose_planetary: 'Планетарное',
    num_purpose_social_male: 'Социальное \u00B7 мужская линия',
    num_purpose_social_female: 'Социальное \u00B7 женская линия',
    num_sky_line: 'Чакры Небо',
    num_earth_line: 'Чакры Земля',
    num_male_code: 'Тройной код мужского рода',
    num_female_code: 'Тройной код женского рода',
    num_ancestral_power: 'Родовая сила',
    num_inner_power: 'Код внутренней силы',
    num_inner_male: 'мужская',
    num_inner_female: 'женская',
    num_inner_total: 'вместе',
    num_health_chakra: 'Чакра',
    num_health_physics: 'Физика',
    num_health_energy: 'Энергия',
    num_health_emotions: 'Эмоции',
    num_health_sum: 'Сумма',
    num_health_total: 'Итог',
    num_decade: 'лет \u00B7 опорная точка {p}',
    num_lang_note: 'Трактовки пока доступны только на украинском языке',
    num_legal_esoteric: 'Расчёты носят информационный, образовательный и рефлексивный характер. Нумерология является символической системой самопознания и не является научно подтверждённым методом диагностики или прогнозирования будущего.',
    num_legal_medical: 'Карта здоровья, чакровый анализ и соответствующие числа не являются медицинской диагностикой. Они не определяют наличие заболеваний, не заменяют обследование, анализы, лечение или консультацию врача. Запрещено прекращать лечение, менять препараты или принимать медицинские решения только на основании нумерологического расчёта.',
    num_legal_prognosis: 'Прогностика и энергии года показывают символические темы и возможные направления внимания, а не гарантированные события. Расчёт не гарантирует наступление брака, беременности, развода, финансового роста, смены работы, переезда или любого другого события.',
    num_err_generic: 'Не удалось рассчитать матрицу',
    num_err_compat: 'Не удалось рассчитать совместимость',
    num_err_energy: 'Не удалось загрузить трактовку',
    err_num_partner_format: 'Неверный формат даты. Введи в формате ДД.ММ.ГГГГ',
    err_num_energy_range: 'Энергия должна быть числом от 1 до 22',
    err_rate_limited: 'Слишком много запросов. Подожди минуту и попробуй снова'
  }
};

/* Підстановка {name} у локалізований рядок.
   Потрібна саме тому, що порядок слів у мовах різний: конкатенація
   'Знайдено ' + n + ' ' + word прибиває переклад до українського синтаксису.
   Невідомий плейсхолдер лишається як є — видно в інтерфейсі, а не мовчки
   зникає разом із числом. */
function fmt(str, vars){
  return String(str).replace(/\{(\w+)\}/g, function(whole, key){
    return (vars && vars[key] !== undefined) ? String(vars[key]) : whole;
  });
}

/* Машинний код відмови → ключ локалі.
   Серверні тексти в webapp/api.py одномовні, і це свідомо: тримати локалі
   у двох місцях означає розсинхронізувати їх на першій же правці. Поки фронт
   показував data.error як є, англомовний користувач бачив «Невірний формат
   дати» — у тому самому потоці, де щойно обрав English.
   Кожен ключ звідси має існувати в api.ERR_* (звіряє tests/test_copy.py). */
var SERVER_ERR_KEY = {
  'first_name_required': 'err_name_required',
  'phone_required':      'err_phone_required',
  'birthdate_required':  'err_birth_required',
  'phone_invalid':       'err_phone_invalid',
  'birthdate_format':    'err_birth_format',
  'birthdate_future':    'err_birth_future',
  'birthdate_too_old':   'err_birth_too_old',
  'unsupported_lang':    'err_unsupported_lang',
  /* Нумерологія. Коди дати партнера сервер віддає з префіксом partner_
     (partner_birthdate_format тощо) — їх тут навмисно немає: префікс знімає
     numErrText() перед пошуком, інакше довелося б дублювати всі чотири
     ключі дати ще раз і синхронізувати два списки замість одного. */
  'numerology_partner_format': 'err_num_partner_format',
  'numerology_energy_range':   'err_num_energy_range',
  /* Стеля частоти запитів до нумерології. Свідомо НЕ в REFUSALS: там кожен
     запис веде на екран вибору тарифу, а це стан тимчасовий — гроші тут ні
     до чого, треба просто зачекати. Пропозиція заплатити у відповідь на
     «занадто часто» була б і незрозумілою, і образливою. */
  'rate_limited':              'err_rate_limited'
};

/* Текст відмови для показу. Порядок навмисний: спершу код, і лише якщо коду
   немає (старий бекенд) — серверний рядок. Зворотний порядок повернув би нас
   до гілкування по копірайту. */
function serverErrText(data, fallbackKey, fallbackText){
  var key = data && data.code && SERVER_ERR_KEY[data.code];
  var srv = (data && data.error) || '';

  /* t(key, null) навмисно без осмисленого фолбеку: тут треба саме відрізнити
     «локаль має переклад» від «не має». Українського словника не існує взагалі
     (мова-джерело живе в розмітці й у фолбеках), тож без цієї перевірки
     україномовний користувач бачив би 'err_birth_format' замість тексту —
     рівно та беззмістовна підказка, якої мав позбутись весь цей механізм. */
  if(key){
    var localized = t(key, null);
    if(localized) return localized;
  }
  if(srv) return srv;
  return t(fallbackKey || 'err_generic', fallbackText || 'Помилка, спробуй ще раз');
}

/* Локалізований рядок або fallback. Fallback обов'язковий і завжди
   осмислений: відсутній ключ не має перетворюватись на 'mod_blog_desc'
   посеред інтерфейсу. */
function t(key, fallback){
  var dict = I18N[LANG];
  var val  = dict && dict[key];
  return (val === undefined || val === null) ? (fallback !== undefined ? fallback : key) : val;
}

/* Проходить розмітку і застосовує поточну локаль.
   При першому проході зберігає оригінал у data-i18n-src, тому перемикання
   uk → en → uk відновлює текст точно таким, як його написав автор. */
function applyI18n(root){
  root = root || document;

  root.querySelectorAll('[data-i18n]').forEach(function(el){
    if(el.dataset.i18nSrc === undefined) el.dataset.i18nSrc = el.textContent;
    el.textContent = t(el.dataset.i18n, el.dataset.i18nSrc);
  });

  root.querySelectorAll('[data-i18n-html]').forEach(function(el){
    if(el.dataset.i18nSrc === undefined) el.dataset.i18nSrc = el.innerHTML;
    el.innerHTML = t(el.dataset.i18nHtml, el.dataset.i18nSrc);
  });

  root.querySelectorAll('[data-i18n-ph]').forEach(function(el){
    if(el.dataset.i18nSrc === undefined) el.dataset.i18nSrc = el.getAttribute('placeholder') || '';
    el.setAttribute('placeholder', t(el.dataset.i18nPh, el.dataset.i18nSrc));
  });

  root.querySelectorAll('[data-i18n-aria]').forEach(function(el){
    if(el.dataset.i18nSrc === undefined) el.dataset.i18nSrc = el.getAttribute('aria-label') || '';
    el.setAttribute('aria-label', t(el.dataset.i18nAria, el.dataset.i18nSrc));
  });

  document.documentElement.setAttribute('lang', LANG);
}

/* Застосовує мову до всього, що вже намальовано: розмітка + усе, що
   рендериться з реєстрів у JS. Без перезавантаження — Telegram WebApp
   після reload втрачає стан і показує сплеш заново. */
function applyLangEverywhere(){
  applyI18n();
  renderModuleGrid();
  renderAuthorStats();
  renderTariffCards();
  renderTariffRows();
  renderTariffIncludes();
  /* Екран нумерології будується з реєстрів через t() і НЕ носить
     data-i18n, тому applyI18n його не бачить. Без цього рядка після
     зміни мови на схемі лишаються попередня панель кодів, підзаголовок
     і назви категорій у сітці блоків — перевірено на живому екрані.
     Умова саме на NUM.active: до першого розрахунку малювати нічого. */
  if(NUM.active) numRenderScheme();
  /* renderState() наприкінці — він сам перемальовує ніші, мову і лічильники. */
  renderState();
}

/* ─── TG SDK ─── */
var tg = window.Telegram && window.Telegram.WebApp || null;

/* ─── ВЬЮПОРТ: повний екран і безпечні зони ───────────────────────────────────

   Тут три різні речі, які легко сплутати в одну:

   • expand()            — розтягує міні-застосунок на висоту ВІКНА. Шапка
                           Telegram при цьому лишається над контентом.
   • requestFullscreen() — Bot API 8.0. Прибирає шапку; кнопки «закрити» й
                           «меню» стають плаваючим накладенням ПОВЕРХ контенту.
   • безпечні зони       — саме через попередній пункт і потрібні.

   Інсетів два, і вони додаються:
     safeAreaInset        — виріз/чубчик самого пристрою;
     contentSafeAreaInset — висота власних кнопок Telegram над контентом.
   env(safe-area-inset-*) у CSS знає лише про перший — про кнопки Telegram
   браузер не знає нічого. Порахувати тільки env() = заголовок екрана поїде
   рівно під кнопку «закрити».

   Усе через feature-detection: клієнти старші за Bot API 8.0 просто не мають
   цих методів, і прямий виклик — не «без повного екрана», а TypeError на
   старті, тобто біла сторінка замість застосунку.
   ─────────────────────────────────────────────────────────────────────────── */

/* Пише порахований інсет у ті самі змінні, які style.css оголошує через env().
   Інлайновий стиль на :root б'є правило зі стилів, тож у браузері (і на старому
   клієнті, де метода немає) лишається поведінка через env(). */
function applyInsets(){
  if(!tg) return;
  var sa  = tg.safeAreaInset        || null;
  var csa = tg.contentSafeAreaInset || null;
  if(!sa && !csa) return;           /* Bot API < 8.0 — лишаємо env() зі стилів */

  sa  = sa  || {};
  csa = csa || {};
  var el = document.documentElement;
  function put(name, a, b){
    el.style.setProperty(name, ((a || 0) + (b || 0)) + 'px');
  }
  put('--sat', sa.top,    csa.top);
  put('--sab', sa.bottom, csa.bottom);
  put('--sal', sa.left,   csa.left);
  put('--sar', sa.right,  csa.right);
}

function initViewport(){
  if(!tg) return;
  tg.ready();

  /* expand() лишається і після переходу на повний екран: якщо клієнт
     відмовить у fullscreen, він — єдине, що розтягне застосунок на висоту
     вікна. */
  tg.expand();

  /* Свайп вниз згортає міні-застосунок. Тут гортається майже кожен екран, тож
     без цього користувач закриває застосунок, просто скролячи список. */
  if(typeof tg.disableVerticalSwipes === 'function'){
    try{ tg.disableVerticalSwipes(); }catch(e){}
  }

  /* Інсети — не константа: вони змінюються при повороті екрана і в момент
     входу/виходу з повного екрана. Разовий підрахунок на старті малює
     правильно рівно до першого повороту. */
  if(typeof tg.onEvent === 'function'){
    tg.onEvent('safeAreaChanged',        applyInsets);
    tg.onEvent('contentSafeAreaChanged', applyInsets);
    tg.onEvent('fullscreenChanged',      applyInsets);
    tg.onEvent('viewportChanged',        applyInsets);

    /* Відмова — штатна відповідь: UNSUPPORTED на старому клієнті,
       ALREADY_FULLSCREEN при подвійному виклику. Не ковтаємо мовчки: без
       цього рядка причина «цей клієнт так не вміє» невідрізненна від бага. */
    tg.onEvent('fullscreenFailed', function(e){
      console.info('[viewport] fullscreen refused:', e && e.error);
      applyInsets();
    });
  }

  if(typeof tg.requestFullscreen === 'function' && tg.isFullscreen !== true){
    try{ tg.requestFullscreen(); }catch(e){
      console.info('[viewport] requestFullscreen threw:', e);
    }
  }

  applyInsets();
}

initViewport();

/* initDataUnsafe годиться лише для показу в UI — сервер йому не вірить. */
function tgUserId(){
  if(tg && tg.initDataUnsafe && tg.initDataUnsafe.user)
    return String(tg.initDataUnsafe.user.id);
  return null;
}
function tgU(){
  return (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) ||
         {first_name:'', last_name:'', username:'', photo_url:null};
}

/* ─── AUTH ─── */
/* Підписаний бот-токеном рядок. Сервер перевіряє HMAC-SHA256 і лише з нього
   бере user_id, тому підмінити його з клієнта неможливо. */
var INIT_DATA = (tg && tg.initData) || '';

var _nativeFetch = window.fetch.bind(window);

function isOwnApi(url){
  if(typeof url !== 'string') return false;
  if(url.indexOf('http') !== 0) return true;
  return url.indexOf(API_BASE) === 0 || url.indexOf(location.origin) === 0;
}

/* Затіняє глобальний fetch у межах цього IIFE, щоб кожен виклик нашого API
   ніс initData без правок на 16 місцях. Стороннім хостам заголовок не йде. */
function fetch(url, opts){
  opts = opts || {};
  if(isOwnApi(url)){
    var h = new Headers(opts.headers || {});
    h.set('X-Init-Data', INIT_DATA);
    opts.headers = h;
  }
  return _nativeFetch(url, opts);
}

/* ─── API helper ─── */
function apiUrl(path){
  return API_BASE + path;
}
function apiFetch(path, opts){
  return fetch(apiUrl(path), opts).then(function(r){ return r.json(); });
}

/* ─── APP STATE ─── */
var S = {
  userId: null,
  registered: false,  // true після успішної авторизації
  /* Період за замовчуванням. Ціни поруч більше немає: поле S.price існувало,
     писалось у selectTariff і не читалось НІДЕ — тобто було другим прайсом,
     який нічого не показував. Другий прайс не помиляється мовчки лише доти,
     доки на нього ніхто не глянув; ціну бере сервер із TARIFF_PRICES. */
  tariff: 'year',
  profile: { first_name:'', last_name:'', phone:'', birthdate:null, niche:null, lang:LANG_DEFAULT },
  subscription: { plan:null, active:false, plan_name:'', expires_at:null, deep_limit:1, short_limit:3 },
  usage: { deep_used:0, short_used:0, deep_left:null, short_left:null },
  strategies_count: 0,
  _currentModule: null
};

/* Дзеркало Subscription.PLAN_MODULES (db/subscription.py). Рішення ухвалює
   сервер; тут матриця живе лише щоб малювати замки ДО відповіді сервера.
   Розбіжність між двома списками ловить тест test_access_matrix.

   'numerology' є в КОЖНОМУ рядку, включно з відсутністю підписки: Матриця
   долі безкоштовна. 'strategy' у безпідписних рядках — не безкоштовна, а
   пробна: доступ є, але квоту 1/3 тримає сервер. Тому бейджі беруться не
   звідси (див. MODULES[].free), інакше пробний розбір читався б як подарунок.

   'starter' лишається, хоч і знятий із продажу: у БД є чинні підписки на
   цьому slug-у, і без рядка тут вони отримали б набір за замовчуванням. */
var ACCESS_MAP = {
  null:      ['numerology','strategy'],
  0:         ['numerology','strategy'],
  'starter': ['numerology','strategy','warmups','content','blog','mentor'],
  '1month':  ['numerology','strategy','warmups','content','blog','mentor'],
  '6months': ['numerology','strategy','warmups','content','blog','mentor'],
  'year':    ['numerology','strategy','warmups','content','blog','mentor']
};

/* ═══════════════════════════════════════════════════
   РЕЄСТР МОДУЛІВ — ЄДИНЕ ДЖЕРЕЛО ПРАВДИ
   Звідси рендериться .mgrid на Головній, заголовок #mod-access,
   #fl-title у потоці, теги онбордингу, підписи в «Мої розбори»
   і заголовок деталі розбору. Ніде більше назви модулів не дублюються.
   ═══════════════════════════════════════════════════ */
var MODULES = {
  strategy:   { glyph:'◈', name:'Знайти свою нішу та продукт', desc:'Зрозумій, що ти можеш продавати, кому це потрібно і як на цьому заробляти.', history:'Мої стратегії' },
  warmups:    { glyph:'◐', name:'Підготуватися до продажу',   desc:'Отримай план сторіс і дописів, які підготують аудиторію до покупки.',            history:'Мої прогріви' },
  content:    { glyph:'◇', name:'Знайти теми для контенту',   desc:'Отримай рубрики, теми та ідеї для дописів, сторіс і Reels.',               history:'Мої системи контенту' },
  blog:       { glyph:'◎', name:'Покращити мій блог',       desc:'Дізнайся, що змінити у профілі, контенті та позиціонуванні.',               history:'Мої аналізи блогу' },
  mentor:     { glyph:'✦', name:'Розібрати мою ситуацію',  desc:'Опиши, що тебе хвилює, та отримай конкретні поради й наступні кроки.',         history:'Мої поради' },
  /* noNiche — модуль не питає нішу. Нумерології потрібна лише дата
     народження; питання «у якій ніші ти працюєш?» перед розрахунком
     матриці не має сенсу і виглядало б як помилка потоку.
     free — модуль не входить у підписку й доступний завжди. Дзеркалить
     Subscription.MODULES_FREE. */
  numerology: { glyph:'◆', name:'Розрахувати Матрицю долі',        desc:'Дізнайся про свій характер, таланти, гроші, стосунки та призначення.',           history:'Мої матриці', noNiche:true, free:true }
};
/* Нумерологія стоїть ПЕРШОЮ навмисно. Вона єдина, яку можна відкрити просто
   так, і саме з неї починається знайомство: п'ять замків над безкоштовним
   модулем читаються як «тут усе платно», і людина йде, не дійшовши до того,
   що їй уже належить.

   Порядок решти п'яти заданий власницею і НЕ є ні алфавітним, ні історичним:
   він іде від найбільш особистого («Поради наставника» — розбір твоєї
   ситуації) до найбільш системного («Система прогріву» — сценарій запуску).
   Міняти його «щоб було логічніше» не треба: це продуктове рішення.

   Масив — єдине джерело порядку. З нього рендериться сітка модулів
   (renderModuleGrid), лічильник модулів (renderAuthorStats) і перелік
   «що відкриває доступ» — тож правка тут одна, а не в трьох місцях. */
var MODULE_ORDER = ['numerology','mentor','blog','content','strategy','warmups'];

/* Чи входить модуль у платну підписку. Одна функція на бейдж, на текст
   пейволу і на список «що відкриває доступ» — щоб «безкоштовність» не
   довелося перелічувати в трьох місцях по-різному. */
function modIsFree(id){ return !!(MODULES[id] || {}).free; }
function proModules(){ return MODULE_ORDER.filter(function(id){ return !modIsFree(id); }); }

/* Реєстр вище — мова-джерело і водночас фолбек. Локаль може його
   перекрити ключем mod_<id>_<поле>; якщо ключа немає — лишається українська,
   і це видно в інтерфейсі, а не ховається за назвою ключа. */
function modName(id){ return t('mod_'+id+'_name', (MODULES[id] || {}).name || id); }
function modDesc(id){ return t('mod_'+id+'_desc', (MODULES[id] || {}).desc || ''); }
function modGlyph(id){ return (MODULES[id] || {}).glyph || '◇'; }
function getHistoryLabel(id){
  return t('mod_'+id+'_hist', (MODULES[id] || {}).history || 'Мої розбори');
}

/* Єдина іконка-замок. Та сама розмітка, що в плитці модуля (.mlock-ico). */
var LOCK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>';

/* Дані автора — в одному місці, не в розмітці. */
var AUTHOR = {
  initials: 'АГ',
  stats: [
    { num:'15+',  key:'aut_stat_people',   label:'років роботи з людьми' },
    { num:'500+', key:'aut_stat_analyses', label:'консультацій і розборів' },
    { num:'7',    key:'aut_stat_years',    label:'років практики у психології та нумерології' }
  ]
};

/* Періоди доступу — одне джерело для карток .tcard і рядків .tq.
   Ціни в гривні, дзеркалять Subscription.TARIFF_PRICES.

   months потрібне не для краси: з нього рахуються і «≈ X ₴/міс», і економія
   проти помісячної оплати. Замовниця назвала ці числа готовими (395 і 1189),
   і саме тому їх тут НЕМАЄ: записані вручну, вони переживуть перше ж
   підвищення ціни й почнуть брехати — причому брехати вигідно для нас, що
   гірше за просто помилку.

   starter із продажу знято. У ACCESS_MAP він лишився (чинні підписки), тут —
   ні: цей масив і є вітрина.

   Тексти лежать парою «ключ + українська». Ключ окремим полем, а не
   зібраний як t('plan_'+plan): зібраний ключ статично не існує, і обидва
   тести покриття локалей мусили б виключити з перевірки ВЕСЬ префікс plan_ і
   tar_ — тобто перестали б стежити за половиною екрана тарифів. Явне поле
   лишає ключ видимим і тестам, і людині, яка шукає, звідки цей рядок. */
var TARIFFS = [
  { plan:'year',    price:3599, months:12,
    nameKey:'plan_year',    name:'12 місяців' },
  { plan:'6months', price:1999, months:6,
    nameKey:'plan_6months',    name:'6 місяців' },
  { plan:'1month',  price:399,  months:1,
    nameKey:'plan_1month',    name:'1 місяць' }
];
var CURRENCY = '₴';

function tariffByPlan(plan){
  for(var i=0;i<TARIFFS.length;i++){ if(TARIFFS[i].plan === plan) return TARIFFS[i]; }
  return null;
}
/* Помісячна ціна — база порівняння. Шукається в самому реєстрі, а не в
   константі поруч: два числа розійшлися б рівно тоді, коли ціну змінять. */
function monthlyPrice(){
  var m = tariffByPlan('1month');
  return m ? m.price : 0;
}
function tariffSaving(tf){
  if(!tf || tf.months <= 1) return 0;
  return monthlyPrice() * tf.months - tf.price;
}
/* Округлення до цілої гривні: «≈ 333 ₴/міс» замість «333.2166…». Знак ≈ у
   підпису чесно каже, що це похідне число, а не те, що спишуть. */
function tariffPerMonth(tf){ return Math.round(tf.price / tf.months); }

/* Тарифи, знятi з продажу. У вітрині (TARIFFS) їх немає — і не має бути, —
   але в БД лежать чинні підписки на цих slug-ах, і профіль мусить називати
   їх людською назвою, а не сирим 'starter'. Ця пара реєстрів і є вся різниця
   між «що продаємо» і «що обслуговуємо». */
var LEGACY_PLANS = {
  starter: { key:'plan_starter_full', uk:'Стартер (7 днів)' }
};

/* Одна назва тарифу на весь застосунок. Раніше та сама мапа PLAN_NAMES була
   написана двічі — у renderState() і в renderTariffsBanner(), — і зняття
   starter довелося б згадати в обох. */
function planDisplayName(plan){
  var tf = tariffByPlan(plan);
  if(tf) return t(tf.nameKey, tf.name);
  var lg = LEGACY_PLANS[plan];
  if(lg) return t(lg.key, lg.uk);
  return '';
}

/* ─── РЕНДЕР ІЗ РЕЄСТРІВ ─── */
/* Бейдж плитки (PRO / Безкоштовно) показується ЛИШЕ тим, хто ще не купив.
   Раніше він лишався назавжди — за міркуванням «бейдж каже, скільки це
   коштує, а не чи є воно в мене». Власниця вирішила інакше, і в неї сильніший
   аргумент: людині, яка вже заплатила, цінник не потрібен — їй потрібні
   модулі. П'ять «PRO» над оплаченими модулями читаються як «щось іще не
   відкрито», тобто напис, придуманий продавати, після оплати починає
   тривожити.
   Хто саме бачить бейдж, вирішує applyAccessChrome() за станом підписки —
   тут розмітка малюється завжди, бо на момент першого рендера стан із
   сервера ще не приїхав. */
function renderModuleGrid(){
  var grid = document.getElementById('mgrid');
  if(!grid) return;
  var tiles = MODULE_ORDER.map(function(id){
    var m = MODULES[id];
    var free = modIsFree(id);
    /* Замок і бейдж — в одному кутовому контейнері, а не двома абсолютами:
       інакше їх довелося б розводити підібраними вручну відступами, і будь-яка
       зміна довжини слова «Безкоштовно» (переклад!) наклала б одне на одне. */
    var corner = '<span class="mc-corner">'
      +'<span class="mlock-ico" aria-hidden="true">'+LOCK_SVG+'</span>'
      +'<span class="mtag '+(free ? 'mtag-free' : 'mtag-pro')+'">'
      + escHtml(free ? t('tag_free','Безкоштовно') : t('tag_pro','PRO'))
      +'</span>'
      +'</span>';
    if(id === 'numerology'){
      return '<button class="mc mc-hero'+(free ? ' mc-free' : '')+'" id="m-'+id+'" data-mod="'+id+'">'
        +corner
        +'<span class="mname">'+escHtml(t('mx_name','Матриця долі'))+'</span>'
        +'<span class="mdesc">'+escHtml(t('mx_desc','Характер, таланти та особистий потенціал'))+'</span>'
        +'<span class="mico" aria-hidden="true">'+MATRIX_ICO+'</span>'
        +'<span class="mc-cta"><span>'+escHtml(t('mx_cta','Розрахувати матрицю'))+'</span>'
        +'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></span>'
        +'</button>';
    }
    return '<button class="mc'+(free ? ' mc-free' : '')+(id === 'numerology' ? ' mc-hero' : '')+'" id="m-'+id+'" data-mod="'+id+'">'
      +corner
      +'<span class="mico" aria-hidden="true">'+(m.glyph === '◆' ? '<span class="rh"></span>' : m.glyph)+'</span>'
      +'<span class="mname">'+escHtml(modName(id))+'</span>'
      +'<span class="mdesc">'+escHtml(modDesc(id))+'</span>'
      +'</button>';
  });
  /* Головна — три картки: Матриця, «Мої послуги» і «Покращити мій блог». Решта
     бізнес-модулів (ситуація, теми, ніша, прогрів, блог) схована всередині
     третьої — на окремому екрані #biz-list. Порядок плиток у tiles — той самий,
     що в MODULE_ORDER. */
  var bizGrid = document.getElementById('biz-grid');
  if(bizGrid) bizGrid.innerHTML = tiles.slice(1).join('');
  grid.innerHTML = [tiles[0], svcTileHtml(), bizTileHtml()].join('');
  /* Грід перемальовується не лише на старті, а й на зміні мови й після
     завантаження профілю. Без цього виклику свіжозроблені бейджі поверталися
     б видимими вже після того, як renderState їх сховав. */
  applyAccessChrome();
}

/* Елементи, які має бачити ЛИШЕ той, у кого доступу ще немає.

   Зібрані в одну функцію навмисно: вони розкидані по трьох екранах (плитки
   на головній, кнопка на екрані автора), і поки кожен ховався у своєму місці,
   один з них незмінно забували — кнопка «Отримати доступ» у розділі «Про
   автора» пропонувала купити те, що вже куплено.

   Кнопки #btn-expand і #btn-renew сюди не входять: вони лежать усередині
   #home-demo-block і #prof-demo-block, які renderState ховає цілком. Ховати
   їх ще й окремо означало б два вимикачі на одну лампу. */
function applyAccessChrome(){
  var active = !!(S.subscription && S.subscription.active);
  /* Бейдж — не текст плитки, а її кутовий елемент; ховаємо саме його, а не
     .mc-corner, бо в кутку живе ще й замок зі своєю логікою. */
  /* З активною підпискою ховаємо ОБИДВА бейджі — і PRO, і «Безкоштовно».
     Раніше «Безкоштовно» лишалося навмисно, але замовниця побачила в цьому
     помилку: у людини з доступом напис про ціну біля модуля зайвий. */
  Array.prototype.forEach.call(document.querySelectorAll('.mgrid .mtag'), function(tag){
    setVis(tag, !active);
  });
  /* Плитка «Мій блог»: з активним доступом під описом — до якої дати він діє. */
  var bizDesc = document.querySelector('#m-biz .mdesc');
  if(bizDesc){
    var base = escHtml(t('biz_tile_desc','Ідеї для профілю, контенту та позиціонування'));
    if(active && S.subscription.expires_at){
      var ex = new Date(S.subscription.expires_at);
      var dt = ex.toLocaleDateString(t('date_locale','uk-UA'), {day:'numeric',month:'long',year:'numeric'});
      bizDesc.innerHTML = base+'<span class="mc-until">'+escHtml(fmt(t('biz_until','Доступ відкрито до {date}'),{date:dt}))+'</span>';
    } else {
      bizDesc.innerHTML = base;
    }
  }
}

/* ─── ТАРИФИ З РЕЄСТРУ ───
   Картки й рядки шита раніше лежали в index.html готовою розміткою: ціна,
   «≈ $8.3 на місяць» і «$100» стояли трьома окремими числами в двох файлах.
   Поки ціна не змінювалась, це працювало. Зміна прайсу означала правку
   чотирьох карток × три числа + чотирьох рядків шита — і будь-яке пропущене
   місце показувало б стару ціну поруч із новою, без жодного падіння.

   Тепер число одне (TARIFFS[].price), решта рахується. Обмеження чесне:
   рахувати можна лише те, що справді похідне — місячну ціну й економію.

   ГОЛОВНЕ, що змінилось у самому продукті: три періоди дають ОДНАКОВИЙ
   доступ. Тому в картці більше немає списку можливостей — він був би різним
   на вигляд і однаковим по суті, тобто натякав би, що річний тариф дає
   більше. Можливості названі один раз, блоком над картками. */
function renderTariffCards(){
  var wrap = document.getElementById('tcards');
  if(!wrap) return;
  wrap.innerHTML = tariffCardsHtml(true);
}

/* Розмітка карток періодів. Одна на вкладку «Тарифи» і на пейвол модуля
   (modPaywallHtml): дві копії розійшлися б на першій же зміні ціни чи
   підпису. withIds — лише для вкладки: id="t-…" там уже чекають тести й
   стилі, а друга картка з тим самим id на сторінці модуля була б дублем. */
function tariffCardsHtml(withIds){
  return TARIFFS.map(function(tf){
    var saving = tariffSaving(tf);
    var cls = 'tcard' + (tf.plan === '1month' ? ' tpop' : '');
    var html = '<button class="'+cls+'"'+(withIds ? ' id="t-'+tf.plan+'"' : '')+' data-plan="'+tf.plan+'">';
    /* Бейдж — це економія в гривнях, а не оцінка «вигідно»/«оптимально».
       Оцінку дає продавець, число людина перевіряє сама. */
    if(saving > 0){
      html += '<span class="tbadge tbr">'
        + escHtml(fmt(t('tar_saving','економія {sum} ₴'), {sum: saving}))
        + '</span>';
    }
    /* Підпис під назвою: ціна за місяць для довгих періодів, а помісячному
       тарифу, де вона дорівнює самій ціні, — навіщо він. */
    var subTxt = tf.months > 1
      ? fmt(t('tar_per_month','{sum} ₴ на місяць'), {sum: tariffPerMonth(tf)})
      : t('tar_try','Щоб спробувати без зобов’язань');
    html += '<span class="tcard-name">'
      +'<span class="tname">'+escHtml(t(tf.nameKey, tf.name))+'</span>'
      +'<span class="tsub">'+escHtml(subTxt)+'</span>'
      +'</span>'
      +'<span class="tprice">'+tf.price+' '+CURRENCY+'</span>'
      +'<span class="tgo" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span>';
    return html + '</button>';
  }).join('');
}

/* «Матриця долі безкоштовна…» — рядок з акцентом на назві. Розмітка <b>
   лежить у самому перекладі (порядок слів у мовах різний), тож вставляємо
   як HTML: це наш словник, а не дані користувача. */
function tariffFreeHtml(){
  return t('tar_free_note','Також сюди входить <b>Матриця долі</b> — безкоштовно і без підписки.');
}

/* Пункти акордеона «Усі бізнес-модулі в кожному тарифі». cur — модуль,
   з якого людина прийшла на пейвол: його підсвічено. */
var CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
function tariffAccordionItems(mods, cur){
  return mods.map(function(id){
    return '<div class="tar-acc-i'+(id === cur ? ' cur' : '')+'">'+CHECK_SVG+escHtml(modName(id))+'</div>';
  }).join('');
}

function renderTariffRows(){
  var wrap = document.getElementById('tqs');
  if(!wrap) return;
  wrap.innerHTML = TARIFFS.map(function(tf, i){
    var sel = i === 0;
    return '<div class="tq'+(sel ? ' sel' : '')+'" id="pq-'+tf.plan+'" data-plan="'+tf.plan+'" role="button" tabindex="0">'
      +'<span class="tqr">'+(sel ? '✓' : '')+'</span>'
      +'<span class="tqi">'
      +'<span class="tqn">'+escHtml(t(tf.nameKey, tf.name))+'</span>'
      +'<span class="tqd">'
      + escHtml(tf.months > 1
          ? fmt(t('tar_per_month_short','≈ {sum} ₴/міс'), {sum: tariffPerMonth(tf)})
          : fmt(t('tar_per_month_short_exact','{sum} ₴/міс'), {sum: tf.price}))
      +'</span>'
      +'</span>'
      +'<span class="tqp">'+tf.price+' '+CURRENCY+'</span>'
      +'</div>';
  }).join('');
  /* Стан вибору синхронізуємо через ту саму функцію, що й кліки: розмітка
     вище лише ставить початкову галочку, а S.tariff міг уже змінитись. */
  selectTariff(tariffByPlan(S.tariff) ? S.tariff : TARIFFS[0].plan);
}

/* Що саме відкриває оплата — списком, один раз, над картками.
   Ціна доступу однакова за наповненням для всіх трьох періодів, тож перелік
   мусить бути один: скільки разів його повторити, стільки й буде місць, де
   він розійдеться з реальністю. */
var TAR_INCL = [
  { id:'mentor',   key:'tar_i_mentor',   uk:'Розбір моєї ситуації' },
  { id:'blog',     key:'tar_i_blog',     uk:'Покращення мого блогу' },
  { id:'content',  key:'tar_i_content',  uk:'Пошук тем для контенту' },
  { id:'strategy', key:'tar_i_strategy', uk:'Пошук моєї ніші та продукту' },
  { id:'warmups',  key:'tar_i_warmups',  uk:'Підготовка до продажу' },
  { id:'numerology', key:'tar_i_numerology', uk:'Матриця долі' }
];
function renderTariffIncludes(){
  var wrap = document.getElementById('tar-incl-list');
  if(!wrap) return;
  wrap.innerHTML = TAR_INCL.map(function(it){
    return '<div class="tli">'+CHECK_SVG
      +'<span class="tli-t">'+escHtml(t(it.key, it.uk))+'</span>'
      +'<span class="tli-d">'+escHtml(modDesc(it.id))+'</span></div>';
  }).join('');
}

function renderAuthorStats(){
  var wrap = document.getElementById('au-stats');
  if(wrap){
    wrap.innerHTML = AUTHOR.stats.map(function(s){
      return '<div class="asbox"><div class="asnum">'+escHtml(s.num)+'</div>'
           + '<div class="aslbl">'+escHtml(t(s.key, s.label))+'</div></div>';
    }).join('');
  }
  var av = document.getElementById('au-av');
  if(av && !av.style.backgroundImage) av.textContent = AUTHOR.initials;
  var mc = document.getElementById('mod-count-demo');
  if(mc) mc.textContent = String(MODULE_ORDER.length);
}

/* ─── ВИДИМІСТЬ ───
   Єдиний спосіб показати/сховати елемент — атрибут hidden.
   У style.css є [hidden]{display:none !important}, тому інлайновий
   style.display більше ніде не потрібен і не використовується. */
function setVis(el, visible){
  if(typeof el === 'string') el = document.getElementById(el);
  if(!el) return;
  if(visible) el.removeAttribute('hidden');
  else        el.setAttribute('hidden','');
}

/* Один компонент завантаження на весь застосунок. */
var COPY_BTN_HTML = '<button class="copy-btn" onclick="copyResult(this)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Копіювати результат</button>';
var LOADING_HTML = '<div class="loading tc"><div class="typing"><span></span><span></span><span></span></div></div>';
function errBlock(msg){ return '<div class="err-block">' + escHtml(msg) + '</div>'; }

/* ─── SCREEN NAV ─── */
var NAVS = ['home','tar','aut','svc-list'];
var NMAP = { home:'ni-home', tar:'ni-tar', aut:'ni-aut', 'svc-list':'ni-svc' };

/* Стек переходів: кнопка «назад» на підекранах повертає туди, звідки прийшли,
   а не на захардкоджений екран. */
var _curScreen = 'splash';
var _navStack  = [];

function pushScreen(id){
  if(_curScreen && _curScreen !== id) _navStack.push(_curScreen);
  show(id);
}
function goBack(fallback){
  var prev = _navStack.pop();
  show(prev || fallback || 'home');
}

/* Відкат pushScreen для екранів-перехідників.
   #mod-access — не завжди екран: коли доступ до модуля відкритий і історії
   ще немає, він стирає власне тіло й пересилає керування далі. Показати його
   на час запиту треба (інакше клік по модулю виглядає проігнорованим), а от
   лишатись у стеку переходів він не має права: наступний pushScreen покладе
   туди саме його, і «назад» приведе на порожню сторінку з заголовком модуля.
   Знімати ЛИШЕ якщо нагорі справді той екран, з якого прийшли: pushScreen
   мовчки нічого не кладе, коли новий екран дорівнює поточному, і беззастережний
   pop у такому разі зняв би чужий запис — тобто «назад» перестрибнув би екран. */
function unwindScreen(to){
  if(_navStack[_navStack.length - 1] === to) _navStack.pop();
  /* _curScreen обовʼязково теж: саме його кладе в стек наступний pushScreen,
     і без цього рядка транзитний екран просто повернувся б на місце. */
  _curScreen = to;
}

function show(id){
  document.querySelectorAll('.scr').forEach(function(s){ s.classList.remove('on'); });
  var el = document.getElementById(id);
  if(el) el.classList.add('on');
  _curScreen = id;
  if(id === 'svc-list') svcRenderItems();
  var bn = document.getElementById('bnav');

  if(NAVS.indexOf(id) >= 0){
    /* Верхній рівень — стек переходів обнуляється. */
    _navStack.length = 0;
    bn.classList.add('on');
    document.querySelectorAll('.ni').forEach(function(n){
      n.classList.remove('a');
      /* Блокуємо навбар для незареєстрованих — тільки тарифи активні */
      if(!S.registered && n.id !== 'ni-tar'){
        n.style.opacity = '0.3';
        n.style.pointerEvents = 'none';
      } else {
        n.style.opacity = '';
        n.style.pointerEvents = '';
      }
    });
    var ni = document.getElementById(NMAP[id]);
    if(ni) ni.classList.add('a');
  } else {
    bn.classList.remove('on');
  }
}

/* ─── BOOT ─── */
/* Скільки тримаємо сплеш: логотип «пишеться» ~2.5 с, підпис з'являється ще ~0.7 с, щоб напис
   встигли роздивитись. Має бути не менше за тривалість анімації .sp-pen. */
var SPLASH_MS = 3000;

function boot(){
  S.userId = tgUserId();
  /* Без initData сервер поверне 401 — показуємо екран «відкрий через бота». */
  if(!INIT_DATA){ setTimeout(function(){ show('ob'); }, SPLASH_MS); return; }
  apiFetch('/api/profile').then(function(data){
    if(!data.ok){ setTimeout(function(){ show('ob'); }, SPLASH_MS); return; }
    var sub = data.subscription || {};
    S.subscription.plan       = sub.plan != null ? sub.plan : null;
    S.subscription.active     = !!sub.active;
    S.subscription.plan_name  = sub.plan_name || '';
    S.subscription.expires_at = sub.expires_at || null;
    var usage = data.usage || {};
    S.usage.deep_used   = usage.deep_used   || 0;
    S.usage.short_used  = usage.short_used  || 0;
    S.usage.deep_left   = usage.deep_left   !== undefined ? usage.deep_left  : null;
    S.usage.short_left  = usage.short_left  !== undefined ? usage.short_left : null;
    S.subscription.deep_limit  = usage.deep_limit  !== undefined ? usage.deep_limit  : 1;
    S.subscription.short_limit = usage.short_limit !== undefined ? usage.short_limit : 3;
    S.strategies_count = data.strategies_count || 0;
    var u = data.user || {};

    /* Мова застосовується ДО першого show(): інакше користувач побачив би
       українську на пів секунди, а потім різку підміну. Сервер завжди віддає
       резолвлений код, тож перевіряти на null тут нічого. */
    if(u.lang && u.lang !== LANG){
      LANG = u.lang;
    }
    S.profile.lang = u.lang || LANG_DEFAULT;
    applyI18n();
    renderModuleGrid(); renderAuthorStats();
    renderTariffCards(); renderTariffRows(); renderTariffIncludes();

    S.profile.first_name = u.first_name || '';
    S.profile.last_name  = u.last_name  || '';
    S.profile.phone      = u.phone      || '';
    S.profile.birthdate  = u.birthdate  || null;
    S.profile.niche      = u.niche      || null;
    if(data.profile_complete){
      S.registered = true;
      applyProfileToUI(); renderState();
      /* Якщо прийшли з WFP через Telegram deep link — показуємо успішний екран */
      var startParam = (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || '';
      /* Також підтримуємо старий ?payment=success для зворотної сумісності */
      var urlParam   = new URLSearchParams(window.location.search).get('payment');
      if(startParam === 'payment_success' || urlParam === 'success'){
        if(urlParam) history.replaceState({}, '', window.location.pathname);
        setTimeout(function(){ show('home'); }, SPLASH_MS);
      } else {
        setTimeout(function(){ show('home'); }, SPLASH_MS);
      }
    } else {
      /* Реєстрація — у боті. Сюди без неї потрапляють лише кнопкою меню
         чи старим повідомленням: показуємо дорогу назад у чат. */
      setTimeout(function(){ show('ob'); }, SPLASH_MS);
    }
  }).catch(function(err){ console.error('[boot]', err); setTimeout(function(){ show('ob'); }, SPLASH_MS); });
}

function applyProfileToUI(){
  var first = S.profile.first_name || '';
  var last  = S.profile.last_name  || '';
  var full  = (first + (last ? ' ' + last : '')).trim() || 'Користувач';
  var init  = full.split(' ').map(function(w){ return w[0]||''; }).join('').slice(0,2).toUpperCase();
  document.getElementById('hm-name').textContent = first || full;
  var tgu = tgU();
  if(tgu.photo_url){ setAv('hm-av', tgu.photo_url); setAv('pf-av', tgu.photo_url); }
  else { document.getElementById('hm-av').textContent = init; document.getElementById('pf-av').textContent = init; }
}

/* Реєстрація перенесена в бота (handlers/common.py). WebApp лише повертає
   туди: закриття міні-застосунку в Telegram і є поверненням у чат. Поза
   Telegram закривати нічого — кнопку там ховаємо. */
function backToBot(){
  if(tg && typeof tg.close === 'function') tg.close();
}

function setAv(id, url){
  var el = document.getElementById(id), img = new Image();
  img.onload = function(){ el.innerHTML=''; img.className = 'avin-img'; el.appendChild(img); };
  img.src = url;
}

/* ─── КВОТИ РОЗБОРІВ ───
   Три стани, а не два, і саме тому тут функція, а не `||`:

     число    — ліміт тарифу;
     null     — БЕЗЛІМІТ (річний тариф, db/usage.py: DEEP_LIMITS['year']=None);
     undefined— відповідь сервера ще не приїхала.

   `S.subscription.short_limit || 3` виглядав нешкідливо і був причиною скарги
   «на річному тарифі пише 1 розбір і 3 уточнення»: у JS `null || 3` це 3, тож
   безлімітний тариф показував рівно демо-квоту. Найдорожча помилка з тих, що
   не падають: власниця бачила її як обман у власному застосунку.
   Тому «безліміт» і «немає даних» розводяться явно й в одному місці. */
function quotaLimit(value, demoFallback){
  if(value === null)      return null;
  if(value === undefined) return demoFallback;
  return value;
}

/* Підпис лічильника. ∞ — не текст локалі: символ однаковий усіма мовами. */
function quotaLabel(used, limit){
  return used + '/' + (limit === null ? ' ∞' : limit);
}

/* Заповнення шкали. Безліміт — порожня шкала: інакше довелося б вигадувати,
   скільки відсотків від нескінченності займають три розбори. */
function quotaPercent(used, limit){
  return (limit === null || !limit) ? 0 : Math.round(used / limit * 100);
}

/* ─── RENDER STATE ─── */
function renderState(){
  var plan = S.subscription.plan, active = S.subscription.active;
  /* Плашки тарифу («Демо» / «12 міс») на головній більше немає: замовниці
     вона здалась незрозумілою. Строк і дата доступу — у профілі й на
     вкладці «Тарифи». */
  /* Бейджі PRO/Безкоштовно і кнопка доступу на екрані автора — те саме
     «показувати лише без доступу», що й блок вище, але їхні елементи живуть
     на інших екранах. Деталі — в applyAccessChrome(). */
  applyAccessChrome();
  var allowed = ACCESS_MAP[plan] || ACCESS_MAP[null];
  MODULE_ORDER.forEach(function(id){
    var el = document.getElementById('m-'+id); if(!el) return;
    el.classList.toggle('locked', allowed.indexOf(id) < 0);
    /* Пробний модуль (strategy на безкоштовному тарифі): доступ є, тож плитка не
       «заблокована», але замок біля PRO показуємо — це платний модуль із
       разовою пробою, а не подарунок. Лише коли підписки ще немає. */
    el.classList.toggle('mc-trial', allowed.indexOf(id) >= 0 && !modIsFree(id) && !active);
  });

  /* ── Лічильники розборів у профілі (обидва блоки) ── */
  var dl = quotaLimit(S.subscription.deep_limit,  1);
  var du = S.usage.deep_used || 0;
  var sl = quotaLimit(S.subscription.short_limit, 3);
  var su = S.usage.short_used || 0;

  /* demo-блок */
  var dc2 = document.getElementById('dc2'); if(dc2) dc2.textContent = quotaLabel(du, dl);
  var sc2 = document.getElementById('sc2'); if(sc2) sc2.textContent = quotaLabel(su, sl);

  /* Кількість стратегій у кнопках */
  var cnt = S.strategies_count || 0;
  var cntLabel = cnt > 0 ? '('+cnt+')' : '';
  var sd = document.getElementById('strat-count-demo');   if(sd) sd.textContent = cntLabel;
  var sa = document.getElementById('strat-count-active'); if(sa) sa.textContent = cntLabel;

  var demoProf = document.getElementById('prof-demo-block');
  var activeProf = document.getElementById('prof-active-block');
  if(active){
    setVis(demoProf, false); setVis(activeProf, true);
    document.getElementById('si-plan-name').textContent =
      planDisplayName(S.subscription.plan) || S.subscription.plan_name || '—';
    document.getElementById('si-status').textContent = t('status_active','Активна');
    if(S.subscription.expires_at){
      var d = new Date(S.subscription.expires_at);
      /* Формат дати теж мовний: 'uk-UA' був захардкоджений і давав
         «17 травня 2026» англомовному користувачу. */
      document.getElementById('si-expires-date').textContent =
        d.toLocaleDateString(t('date_locale','uk-UA'),{day:'numeric',month:'long',year:'numeric'});

      /* Логіка кнопки "Продовжити доступ" */
      var now      = new Date();
      now.setHours(0,0,0,0);
      var exp      = new Date(d); exp.setHours(0,0,0,0);
      var msLeft   = exp - now;
      var daysLeft = Math.round(msLeft / (1000*60*60*24));

      var btnRenew  = document.getElementById('btn-renew2');
      var renewMsg  = document.getElementById('renew-wait-msg');
      if(btnRenew){
        /* Дозволяємо продовжити якщо: ≤1 день до кінця АБО вичерпано розбори */
        var deepLeft   = S.usage.deep_left;
        var limitsOut  = deepLeft !== null && deepLeft === 0;
        var canRenewNow = daysLeft <= 1 || limitsOut;

        if(canRenewNow){
          btnRenew.disabled = false;
          btnRenew.style.opacity = '';
          if(renewMsg) setVis(renewMsg, false);
        } else {
          btnRenew.disabled = true;
          btnRenew.style.opacity = '0.45';
          if(renewMsg){
            setVis(renewMsg, true);
            renewMsg.textContent = t('renew_wait',
              'Продовження доступне за 1 день до закінчення або при вичерпанні розборів. Залишилось {days} дн.'
            ).replace('{days}', daysLeft);
          }
        }
      }
    }
    document.getElementById('pdb').style.width = (dl ? Math.round(du/dl*100) : 0)+'%';
    document.getElementById('psb').style.width = (sl ? Math.round(su/sl*100) : 0)+'%';
    document.getElementById('pdc').textContent = dl !== null ? du+'/'+dl : du+'/∞';
    document.getElementById('psc').textContent = sl !== null ? su+'/'+sl : su+'/∞';
  } else {
    setVis(demoProf, true); setVis(activeProf, false);
  }
  animBars();
  renderTariffsBanner();
  renderNicheBlock();
  renderLangBlock();
}

/* Плашка «доступ уже активний» на вкладці «Тарифи».

   Вкладка не знала, кому її показують: той самий список цін бачив і той, хто
   ще не платив, і той, у кого доступ діє. Другому він читався як «сплати ще
   раз» — при тому, що оплата йому навмисно закрита (_pwSyncPayState ховає
   кнопку, поки не лишиться ≤1 дня або поки не вичерпано розбори). Тобто
   відповідь «у тебе вже все є» існувала, але діставалась лише тому, хто
   пройшов увесь шлях до шита оплати.

   Умова — S.subscription.active, той самий прапорець, за яким перемикаються
   демо-блок і картка підписки в профілі. Не наявність plan: план лишається в
   стані й після закінчення строку, і плашка пережила б сам доступ.

   Примітка внизу різна, бо різні дії: поки лишається запас — пояснюємо, чому
   оплата закрита (інакше людина тисне картку й упирається в стіну); коли
   продовження вже можливе — кажемо, що новий період додається до поточного, бо
   головний страх при поновленні — «а невикористані дні згорять?». */
function renderTariffsBanner(){
  var box = document.getElementById('tar-active');
  if(!box) return;

  var active = S.subscription.active;
  setVis(box, !!active);
  var pickB = document.getElementById('btn-pick-plan'), openB = document.getElementById('btn-open-blog');
  if(pickB) pickB.textContent = active ? t('tar_pick_btn_renew','Продовжити доступ') : t('tar_pick_btn','Обрати тариф');
  if(openB) setVis(openB, !!active);
  if(!active) return;

  var planName = planDisplayName(S.subscription.plan) || S.subscription.plan_name || '';

  var planEl = document.getElementById('tar-active-plan');
  var noteEl = document.getElementById('tar-active-note');

  /* Дата — головне, заради чого сюди взагалі заходять із активним доступом.
     Формат через локаль користувача: 'uk-UA' у хардкоді вже одного разу
     показував «17 травня 2026» англомовному. */
  var untilTxt = '';
  var daysLeft = null;
  if(S.subscription.expires_at){
    var exp = new Date(S.subscription.expires_at); exp.setHours(0,0,0,0);
    var now = new Date(); now.setHours(0,0,0,0);
    daysLeft = Math.round((exp - now) / (1000*60*60*24));
    untilTxt = fmt(t('tar_active_until','до {date}'),
                   {date: exp.toLocaleDateString(t('date_locale','uk-UA'),
                                                 {day:'numeric',month:'long',year:'numeric'})});
  }
  if(planEl){
    planEl.textContent = untilTxt ? (planName + ' · ' + untilTxt)
                                  : (planName || t('status_active','Активна'));
  }

  if(noteEl){
    var deepLeft  = S.usage.deep_left;
    var limitsOut = deepLeft !== null && deepLeft === 0;
    var canRenew  = daysLeft === null || daysLeft <= 1 || limitsOut;
    noteEl.textContent = canRenew
      ? t('tar_active_note_renew','Обраний тариф додасться до поточного доступу.')
      : t('tar_active_note_wait','Тарифи нижче — для продовження. Оплата відкриється за день до закінчення або коли закінчаться розбори.');
  }
}

function animBars(){
  var dl = quotaLimit(S.subscription.deep_limit,  1);
  var sl = quotaLimit(S.subscription.short_limit, 3);
  var du = S.usage.deep_used || 0;
  var su = S.usage.short_used || 0;
  /* Блок лімітів на головній прибраний (замість нього — «Мої послуги»), тож
     елементів може не бути: пишемо лише в ті, що є. */
  var _db = document.getElementById('db'), _sb = document.getElementById('sb');
  var _dc = document.getElementById('dc'), _sc = document.getElementById('sc');
  if(_db) _db.style.width = quotaPercent(du, dl)+'%';
  if(_sb) _sb.style.width = quotaPercent(su, sl)+'%';
  if(_dc) _dc.textContent = quotaLabel(du, dl);
  if(_sc) _sc.textContent = quotaLabel(su, sl);
}

/* ═══════════════════════════════════════════════════
   ДОСТУП — ЄДИНА ТОЧКА ВХОДУ

   Будь-яка кнопка про доступ на будь-якому екрані веде сюди і тільки сюди.
   Ніяких проміжних діалогів, ніякого show() перед відкриттям шита:
   шит відкривається поверх того екрана, де користувач зараз стоїть.
   ═══════════════════════════════════════════════════ */

var PW_PANELS = ['pw-action','pw-loading','pw-redirect','pw-error','pw-success'];

function _pwShow(id){
  PW_PANELS.forEach(function(s){ setVis(s, s === id); });
}

/* Рядок контексту над списком періодів: пояснює, чому шит відкрився. */
var ACCESS_REASONS = {
  locked_module: '',
  demo_used:     'Демо-розбір уже використано.',
  limit_reached: 'Розбори на поточному тарифі закінчились.',
  renew:         'Новий період додається до поточного.',
  browse:        ''
};

/**
 * Єдина публічна функція входу в оплату.
 * @param {string} reason  locked_module | demo_used | limit_reached | renew | browse
 */
function requestAccess(reason){
  var pw = document.getElementById('pw');
  if(!pw) return;

  /* Контекстний рядок — єдине, що змінюється залежно від причини.
     Список періодів, порядок, ціни й кнопка оплати завжди ідентичні. */
  var reasonEl = document.getElementById('pw-reason');
  /* Реєстр вище — мова-джерело, локаль перекриває ключем reason_<причина>,
     як і в MODULES. Порожній рядок ('browse') має лишитись порожнім, тому
     фолбек беремо з реєстру, а не з ключа. */
  var src  = ACCESS_REASONS[reason];
  var text = (src === undefined || src === '') ? '' : t('reason_' + reason, src);
  if(reasonEl){
    reasonEl.textContent = text;
    setVis(reasonEl, !!text);
  }

  /* Незареєстрованому оплата недоступна: реєстрація — у боті. */
  if(!S.registered){ show('ob'); return; }

  pw.classList.add('open');
  _pwShow('pw-action');
  _pwSyncPayState(reason);
}

/* Вирішує, чи зараз можна платити, і показує пояснення якщо ні. */
function _pwSyncPayState(reason){
  var btnPay    = document.getElementById('btn-pay');
  var pwInfo    = document.getElementById('pw-info');
  var infoTxt   = document.getElementById('pw-info-text');
  var renewHint = document.getElementById('pw-renew-hint');

  if(S.subscription.active && S.subscription.expires_at){
    var now = new Date(); now.setHours(0,0,0,0);
    var exp = new Date(S.subscription.expires_at); exp.setHours(0,0,0,0);
    var daysLeft = Math.round((exp - now) / (1000*60*60*24));

    /* Блокуємо оплату лише якщо доступ активний, лишилось > 1 дня І ліміти не вичерпано. */
    var deepLeft  = S.usage.deep_left;
    var limitsOut = deepLeft !== null && deepLeft === 0;
    if(daysLeft > 1 && !limitsOut){
      setVis(btnPay, false);
      setVis(pwInfo, true);
      if(infoTxt){
        /* Розмітка всередині рядка навмисна: <strong> стоїть довкола числа,
           а в англійській порядок слів інший. Тому в локалі лежить фраза
           цілком, а не склеюється з шматків. */
        infoTxt.innerHTML =
          escHtml(t('pw_info_when','Оплата відкриється за день до закінчення або коли закінчаться розбори.')) + '<br>'
          + fmt(t('pw_info_left','Залишилось <strong>{days} дн.</strong> і <strong>{deep} розборів</strong>.'),
                {days: daysLeft, deep: deepLeft}) + '<br>'
          +'<span class="pw-info-dim">'
          + escHtml(fmt(t('pw_info_until','Доступ діє до {date}'),
              {date: exp.toLocaleDateString(t('date_locale','uk-UA'),
                                            {day:'numeric',month:'long',year:'numeric'})}))
          + '</span>';
      }
      setVis(renewHint, false);
      return;
    }
  }

  setVis(btnPay, true);
  setVis(pwInfo, false);
  /* Підказка про додавання періоду — лише при поновленні активного доступу. */
  setVis(renewHint, S.subscription.active || reason === 'renew');
}

/* Синхронний вибір періоду: тримає в парі картки .tcard (екран «Тарифи»)
   і рядки .tq (шит). Раніше це був дубльований forEach у двох місцях. */
function selectTariff(plan){
  S.tariff = plan;
  document.querySelectorAll('.tq').forEach(function(q){
    var on = q.id === 'pq-' + plan;
    q.classList.toggle('sel', on);
    var r = q.querySelector('.tqr'); if(r) r.textContent = on ? '✓' : '';
  });
  /* За data-plan, а не за id: картки пейволу модуля id не мають. */
  document.querySelectorAll('.tcard').forEach(function(c){
    c.classList.toggle('sel', c.dataset.plan === plan);
  });
}

function closePW(){
  document.getElementById('pw').classList.remove('open');
  if(S._subscriptionJustActivated){ S._subscriptionJustActivated=false; _refreshSubscription(); }
}
var _pollTimer = null;
function _startPolling(){
  var attempts=0, maxAttempts=20;
  _pollTimer = setInterval(function(){
    attempts++;
    apiFetch('/api/profile').then(function(data){
      if(data.ok && data.subscription && data.subscription.active){
        clearInterval(_pollTimer); _pollTimer=null;
        S.subscription.plan=data.subscription.plan; S.subscription.active=true;
        S.subscription.plan_name=data.subscription.plan_name; S.subscription.expires_at=data.subscription.expires_at;
        S._subscriptionJustActivated=true; _pwShow('pw-success');
        renderPaySuccess(data.subscription);
        renderState();
      }
    }).catch(function(){});
    if(attempts>=maxAttempts){ clearInterval(_pollTimer); _pollTimer=null; }
  }, 3000);
}
/* Сторінка успішної оплати: тариф і дата, що саме відкрилось, і дві кнопки. */
function renderPaySuccess(sub){
  var date = '';
  if(sub && sub.expires_at){
    date = new Date(sub.expires_at).toLocaleDateString(t('date_locale','uk-UA'),
             {day:'numeric',month:'long',year:'numeric'});
  }
  var txt = document.getElementById('pw-success-text');
  if(txt){
    txt.textContent = date
      ? fmt(t('pw_ok_until','Тариф «{plan}» діє до {date}'), {plan: (sub.plan_name||''), date: date})
      : fmt(t('pw_ok_plan','Тариф «{plan}» активовано'), {plan: (sub && sub.plan_name) || ''});
  }
  var list = document.getElementById('pw-success-list');
  if(list){
    list.innerHTML = TAR_INCL.map(function(it){
      return '<div class="tli compact">'+CHECK_SVG+'<span class="tli-t">'+escHtml(t(it.key, it.uk))+'</span></div>';
    }).join('');
  }
}
function _refreshSubscription(){
  apiFetch('/api/profile').then(function(data){
    if(!data.ok) return;
    var sub=data.subscription||{};
    S.subscription.plan=sub.plan!=null?sub.plan:null; S.subscription.active=!!sub.active;
    S.subscription.plan_name=sub.plan_name||''; S.subscription.expires_at=sub.expires_at||null;
    /* Оновлюємо ліміти і usage з нового доступу */
    var usage=data.usage||{};
    S.usage.deep_used   = usage.deep_used   || 0;
    S.usage.short_used  = usage.short_used  || 0;
    S.usage.deep_left   = usage.deep_left   !== undefined ? usage.deep_left  : null;
    S.usage.short_left  = usage.short_left  !== undefined ? usage.short_left : null;
    S.subscription.deep_limit  = usage.deep_limit  !== undefined ? usage.deep_limit  : 1;
    S.subscription.short_limit = usage.short_limit !== undefined ? usage.short_limit : 3;
    renderState();
  }).catch(function(){});
}
function pay(){
  _pwShow('pw-loading');
  apiFetch('/api/subscription/request', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ tariff:S.tariff })
  }).then(function(data){
    if(!data.ok){ var e=document.getElementById('pw-error-text'); if(e) e.textContent=serverErrText(data,'err_invoice_failed','Не вдалося створити інвойс'); _pwShow('pw-error'); return; }
    _pwShow('pw-redirect');
    var link=document.getElementById('pw-redirect-link'); if(link) link.href=data.payment_url;
    if(data.payment_url){ if(tg && tg.openLink) tg.openLink(data.payment_url); else window.open(data.payment_url,'_blank'); }
    if(_pollTimer) clearInterval(_pollTimer); _startPolling();
  }).catch(function(err){
    console.error('[pay]',err);
    var e=document.getElementById('pw-error-text'); if(e) e.textContent=t('err_network_check','Помилка мережі. Перевір зʼєднання.');
    _pwShow('pw-error');
  });
}

/* ─── MODULE CLICK ─── */
/* Клік по модулю ЗАВЖДИ дає один і той самий результат: екран модуля.
   Причину блокування показує сам екран, а не окремий діалог. */
function handleModClick(id){
  var el = document.getElementById('m-'+id); if(!el) return;
  S._currentModule = id;
  openModAccess(id);
}

function openModAccess(id){
  S._currentModule = id;
  /* Запамʼятовуємо ДО pushScreen: якщо екран виявиться перехідником, повертати
     треба саме сюди, а після pushScreen поточним уже буде сам #mod-access. */
  var from = _curScreen;
  var title = document.getElementById('mod-access-title');
  /* Гліф — окремим спаном, як у .aibadge: відступ задає CSS, а не пробіли. */
  if(title) title.innerHTML =
    '<span class="fltitle-glyph" aria-hidden="true">' + modGlyph(id) + '</span>'
    + escHtml(modName(id));
  var body = document.getElementById('mod-access-body');
  if(body) body.innerHTML = LOADING_HTML;
  pushScreen('mod-access');
  fetch(apiUrl('/api/module/access?module='+id))
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(!data.ok){ body.innerHTML = errBlock(t('err_loading','Помилка завантаження')); return; }
      renderModAccess(id, data, from);
    })
    .catch(function(){ body.innerHTML = errBlock(t('err_network','Помилка мережі')); });
}

/* Одна картка блокування на всі три причини. Кнопка завжди одна й та сама,
   різниця тільки в reason, який керує контекстним рядком у шиті. */
function modBlockedCard(title, sub, reason){
  return '<div class="mod-access-card blocked">'
    +'<div class="mod-access-lock">'+LOCK_SVG+'</div>'
    +'<div class="mod-access-title">'+escHtml(title)+'</div>'
    +'<div class="mod-access-sub">'+escHtml(sub)+'</div>'
    +'<button class="btn bp bsm" id="ma-btn-buy" data-reason="'+reason+'">'+escHtml(t('btn_get_access','Отримати доступ'))+'</button>'
    +'</div>';
}

/* Пейвол модуля — СТОРІНКА з поясненням і тарифами, а не картка з кнопкою.

   Так у ТЗ замовниці: «якщо користувач без підписки натискає на платний
   модуль, відкривається сторінка з поясненням можливостей і тарифами». Доти
   тут стояла картка «Потрібен доступ» з однією кнопкою, а що саме дає
   підписка й скільки коштує, людина дізнавалась лише з шита оплати — і то
   без переліку модулів.

   Зміст той самий, що на вкладці «Тарифи»: перелік модулів із реєстру
   (proModules), примітка про безкоштовну нумерологію і ті самі картки
   (tariffCardsHtml). Тап по картці — той самий шит оплати з уже вибраним
   періодом, тож шлях до WayForPay один на весь застосунок. */
function modPaywallHtml(id, title, sub, reason, extra){
  /* Пейвол модуля — коротка сторінка: шапка, що дає доступ, і одна золота кнопка
     «Обрати тариф»; періоди з'являються після тапу (так само, як на вкладці
     «Мій блог»). */
  var h = '<div class="mod-access-card blocked mpw-head">'
    +'<div class="mod-access-lock">'+LOCK_SVG+'</div>'
    +'<div class="mpw-head-txt">'
    +'<div class="mod-access-title">'+escHtml(title)+'</div>'
    +(sub ? '<div class="mod-access-sub">'+escHtml(sub)+'</div>' : '')
    +'</div></div>';
  h += extra || '';
  h += '<div class="tar-acc tar-box mpw-incl">'
    +'<div class="tar-acc-hd"><span class="tar-acc-ok" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.4 2.4 4.6-4.8"/></svg></span>'
    +'<span>'+escHtml(t('tar_incl_title','Що ти отримаєш після оплати?'))+'</span></div>'
    +'<div class="tar-acc-list">'
    + TAR_INCL.map(function(it){
        return '<div class="tli compact'+(it.id === id ? ' cur' : '')+'">'+CHECK_SVG
          +'<span class="tli-t">'+escHtml(t(it.key, it.uk))+'</span></div>';
      }).join('')
    +'</div></div>';
  h += '<button class="btn bp" id="ma-btn-pick">'+escHtml(t('tar_pick_btn','Обрати тариф'))+'</button>';
  h += '<div class="mpw-plans" id="ma-plans" hidden>'
    +'<div class="sect-lbl">'+escHtml(t('tar_pick_lbl','Обери період доступу'))+'</div>'
    +'<div class="mpw-tcards" data-reason="'+escHtml(reason)+'">'+tariffCardsHtml(false)+'</div></div>';
  return h;
}

function renderModAccess(id, data, from){
  var body = document.getElementById('mod-access-body');
  var html = '';

  if(data.has_history){
    var cnt = data.history_count;
    /* Одна кнопка «Мої …» — лише коли історія справді є. Окремого підпису й
       карток-превʼю немає: вони дублювали саму кнопку. */
    var histBtn = '<button class="btn bg bsm ma-hist" id="ma-btn-history"><span>'
      +escHtml(getHistoryLabel(id))+'</span><span class="strat-count">'+cnt+'</span></button>';
    if(!data.can_generate && !data.has_subscription){
      html += modPaywallHtml(id,
        t('ma_locked_title','Потрібен доступ'), '',
        data.demo_expired ? 'demo_used' : 'locked_module', histBtn);
    } else if(data.can_generate){
      html += '<div class="bpair b12">'+histBtn
        +'<button class="btn bp bsm" id="ma-btn-new">'+escHtml(t('ma_btn_new','Розробити нову'))+'</button></div>';
    } else {
      html += '<div class="bpair b12">'+histBtn
        +'<button class="btn bs bsm ico-lead" disabled>'+LOCK_SVG+escHtml(t('ma_limit_short','Ліміт вичерпано'))+'</button></div>';
    }
  } else {
    if(data.can_generate){
      /* Демо або активний доступ — одразу в модуль. Тіло стирається, бо екран
         тут перехідник; разом із тілом його треба прибрати й зі стека
         переходів, інакше «назад» у модулі приведе саме на цю порожнечу. */
      body.innerHTML = '';
      unwindScreen(from);
      setTimeout(function(){ goMod(id); }, 80);
      return;
    } else if(data.demo_expired){
      html += modPaywallHtml(id, t('ma_demo_used_title','Демо використано'),
        t('ma_demo_used_sub','Безкоштовний розбір уже витрачено. Щоб продовжити — обери період доступу.'),
        'demo_used');
    } else if(!data.has_subscription){
      html += modPaywallHtml(id, t('ma_locked_title','Потрібен доступ'),
        '',
        'locked_module');
    } else {
      /* Сюди потрапляємо лише коли сервер сказав can_generate:false при
         активній підписці, тобто ліміт скінченний і вичерпаний. '∞' і '?' —
         запобіжники на випадок, якщо це колись перестане бути правдою:
         «Використано 5 з null розборів» — гірше за будь-який із них. */
      var dl = data.usage ? (data.usage.deep_limit === null ? '∞' : data.usage.deep_limit) : '?';
      var du = data.usage ? data.usage.deep_used  : '?';
      html += modBlockedCard(t('ma_limit_title','Ліміт розборів вичерпано'),
        fmt(t('ma_limit_sub','Використано {used} з {limit} розборів на цьому тарифі.'),
            {used: du, limit: dl}),
        'limit_reached');
    }
  }
  body.innerHTML = html;
  var btnHist = document.getElementById('ma-btn-history');
  if(btnHist) btnHist.addEventListener('click', function(){ openMyStrategies(id); });
  var btnNew = document.getElementById('ma-btn-new');
  if(btnNew) btnNew.addEventListener('click', function(){
    /* Нумерологія: «Розробити нову» = одразу запитати, для якої дати. Картку
       профілю й три кнопки людина вже бачила б не на тому кроці: попередні
       матриці вона відкриває сусідньою кнопкою, а тут обирає нову дату. */
    if(id === 'numerology'){ numOpenNew(); return; }
    askNicheThenGo(id);
  });
  var pickPlan = document.getElementById('ma-btn-pick');
  if(pickPlan) pickPlan.addEventListener('click', function(){
    hapticTap();
    var pl = document.getElementById('ma-plans');
    if(pl){
      pl.hidden = false; pickPlan.hidden = true;
      try{ pl.scrollIntoView({behavior:'smooth', block:'start'}); }catch(e){}
    }
  });
  var btnBuy = document.getElementById('ma-btn-buy');
  /* Без show() — шит відкривається поверх цього ж екрана. */
  if(btnBuy) btnBuy.addEventListener('click', function(){ requestAccess(btnBuy.dataset.reason); });
  /* Картки пейволу — як на вкладці «Тарифи»: вибір періоду + шит оплати. */
  var mpw = body.querySelector('.mpw-tcards');
  if(mpw) mpw.addEventListener('click', function(e){
    var card = e.target.closest('.tcard');
    if(!card || !tariffByPlan(card.dataset.plan)) return;
    selectTariff(card.dataset.plan);
    requestAccess(mpw.dataset.reason);
  });
  document.querySelectorAll('#mod-access-body .strat-card').forEach(function(card){
    card.addEventListener('click', function(){
      openStrategyDetailWithFollowup(parseInt(card.dataset.sid), card.dataset.mod, card.dataset.date);
    });
  });
}


/* ═══════════════════════════════════════════════════
   МОДУЛЬ СТРАТЕГІЯ ПІД НІШУ — повний флоу з 9 питань
   ═══════════════════════════════════════════════════ */

/* ─── МУЛЬТИВИБІР ───
   Один перемикач на всі пʼять анкет. Раніше тіло обробника було скопійоване
   пʼять разів (mnt/blog/cont/warm/strat) — і поки воно робило рівно
   «push або splice», дублювання нікому не заважало. Заважати воно почало
   тут: питання «що саме ти продаєш?» стало мультивибором, а серед варіантів
   є «Поки нічого не продаю» — відповідь, яка не може стояти поруч з іншими.
   «Консультації, Поки нічого не продаю» не впаде і навіть не підсвітиться
   в тестах: воно просто поїде в промпт і зіпсує розбір мовчки. Дописувати
   таке правило вп'ятеро — гарантія, що на п'ятій копії його забудуть.

   Тому список взаємовиключних варіантів тепер оголошується декларативно
   (`exclusive` у самому питанні), а не живе в обробнику.

   list мутується НА МІСЦІ (`length = 0`, а не новий масив): виклики
   тримають посилання на mnt.multi/blog.multi/…, і підміна масиву тихо
   від'єднала б стан флоу від того, що бачить користувач. */
function toggleMulti(list, opt, q, grid){
  var exclusive = q.exclusive || [];
  var idx = list.indexOf(opt);
  if(idx >= 0){
    list.splice(idx, 1);
  } else if(exclusive.indexOf(opt) >= 0){
    list.length = 0;
    list.push(opt);
  } else {
    for(var i = list.length - 1; i >= 0; i--){
      if(exclusive.indexOf(list[i]) >= 0) list.splice(i, 1);
    }
    list.push(opt);
  }
  /* Перемальовуємо ВСІ чіпи, а не лише натиснутий: вибір «нічого не продаю»
     знімає підсвітку з інших, і зробити це може тільки спільний прохід. */
  Array.prototype.forEach.call(grid.querySelectorAll('.chip'), function(c){
    c.classList.toggle('sel', list.indexOf(c.textContent) >= 0);
  });
}

var STRATEGY_QUESTIONS = [
  {
    /* Мультивибір: експерт рідко продає рівно одне. Вимога обрати щось одне
       змушувала вказати «Консультації», коли насправді є ще й курс, — і
       стратегія монетизації будувалась на пів-картинці. */
    id:'product',
    text:'Що саме ти продаєш?',
    sub:'Можна обрати кілька',
    type:'chips-multi',
    options:['Консультації','Наставництво','Онлайн-курс','Офлайн-послуги','Марафон','Інфопродукт']
  },
  {
    id:'price',
    text:'Який середній чек продукту?',
    sub:'Допомагає зрозуміти модель монетизації',
    type:'chips',
    options:['До $50','$50–$200','$200–$500','$500–$1000','$1000–$3000','Більше $3000']
  },
  {
    id:'client',
    text:'Хто твій ідеальний клієнт?',
    sub:'Опиши — стать, вік, ситуація, що шукає',
    type:'text',
    placeholder:'Наприклад: жінки 30–45, мами у декреті, хочуть знайти себе і почати заробляти'
  },
  {
    id:'problem',
    text:'Яку головну проблему ти вирішуєш?',
    sub:'Обери один варіант',
    type:'chips',
    options:['Знайти призначення','Заробляти більше','Побудувати відносини','Покращити здоров\'я','Розібратись у собі','Розвинути бізнес']
  },
  {
    id:'subscribers',
    text:'Скільки підписників у тебе зараз?',
    sub:'Допомагає визначити стадію розвитку блогу',
    type:'chips',
    options:['Менше 500','500–2000','2000–5000','5000–10 000','10 000–50 000','Більше 50 000']
  },
  {
    id:'current_income',
    text:'Який твій поточний дохід з блогу?',
    sub:'Якщо ще нема — обери перший варіант',
    type:'chips',
    options:['Ще не монетизую','До $500/міс','$500–$1500/міс','$1500–$3000/міс','$3000–$7000/міс','Більше $7000/міс']
  },
  {
    id:'goal_income',
    text:'Яка твоя фінансова ціль?',
    sub:'Скільки хочеш заробляти з блогу щомісяця',
    type:'chips',
    options:['$1000/міс','$2000/міс','$5000/міс','$10 000/міс','$20 000/міс','Більше $20 000/міс']
  },
  {
    id:'challenge',
    text:'Що тобі зараз найскладніше у блозі?',
    sub:'Можна обрати кілька',
    type:'chips-multi',
    options:['Немає заявок','Мало підписників','Складно продавати','Не знаю про що писати','Боюся проявлятися','Немає системи']
  }
];

/* Стан флоу стратегії */
var strat = { answers:{}, q:0, multi:[] };

/* ══════════════════════════════════════════════
   МОДУЛЬ 5 — ПОРАДИ НАСТАВНИКА
   ══════════════════════════════════════════════ */

var MENTOR_QUESTIONS = [
  {
    id:'product',
    text:'Що саме ти продаєш?',
    sub:'Можна обрати кілька',
    type:'chips-multi',
    options:['Консультації','Наставництво','Онлайн-курс','Групову програму','Діагностику / розбір','Послуги','Поки нічого не продаю'],
    exclusive:['Поки нічого не продаю']
  },
  {
    id:'income',
    text:'Який твій поточний дохід з блогу?',
    sub:'Приблизно — допомагає визначити стадію',
    type:'chips',
    options:['Ще не монетизую','До $200/міс','$200–$500/міс','$500–$1 500/міс','$1 500–$3 000/міс','Більше $3 000/міс']
  },
  {
    id:'goal',
    text:'Яка твоя головна ціль зараз?',
    sub:'Обери один варіант',
    type:'chips',
    options:['Збільшити дохід','Отримати більше заявок','Вирости в блозі','Створити або покращити продукт','Побудувати систему продажів','Масштабуватись','Подолати страх і почати проявлятися']
  },
  {
    id:'situation',
    text:'Опиши свою ситуацію або проблему',
    sub:'Чим детальніше — тим точніший розбір',
    type:'text',
    placeholder:'Наприклад: веду блог 6 місяців, є 2000 підписників, виклала кілька курсів але купила лише одна людина. Не розумію що роблю не так'
  },
  {
    id:'blocker',
    text:'Що тебе найбільше зупиняє зараз?',
    sub:'Можна обрати кілька',
    type:'chips-multi',
    options:['Страх проявлятися','Хаос і немає системи','Немає клієнтів / заявок','Складно продавати','Не знаю що робити далі','Немає часу і ресурсу','Порівнюю себе з іншими і злива']
  },
  {
    id:'tried',
    text:'Що ти вже пробувала робити?',
    sub:'Розкажи коротко — що вже було',
    type:'text',
    placeholder:'Наприклад: вела рілс, навчалась на курсах, пробувала рекламу, але результату немає'
  },
  {
    id:'resource',
    text:'Скільки часу і ресурсу у тебе є зараз?',
    sub:'Допомагає скласти реалістичний план',
    type:'chips',
    options:['До 2 годин на тиждень','2–5 годин на тиждень','5–10 годин на тиждень','Більше 10 годин на тиждень','Повний робочий день']
  }
];

/* Стан флоу порад наставника */
var mnt = { answers:{}, q:0, multi:[] };

function goMentorMod(){
  mnt.answers = {}; mnt.q = 0; mnt.multi = [];
  if(S.profile.niche) mnt.answers.niche = S.profile.niche;
  document.getElementById('fl-title').textContent = modName('mentor');
  setVis('fl-r', false);
  setVis('fl-q', true);
  show('mflow');
  renderMntQ();
}

function renderMntProg(){
  var total = MENTOR_QUESTIONS.length, cur = mnt.q;
  var h = '';
  for(var i=0;i<total;i++){
    if(i < cur)        h += '<div class="fp done"></div>';
    else if(i === cur) h += '<div class="fp cur wide"></div>';
    else               h += '<div class="fp"></div>';
  }
  document.getElementById('fl-prog').innerHTML = h;
}

function renderMntQ(){
  renderMntProg();
  var q     = MENTOR_QUESTIONS[mnt.q];
  var total = MENTOR_QUESTIONS.length;
  var container = document.getElementById('fl-q');
  container.innerHTML = '';

  var wrap = document.createElement('div');
  wrap.className = 'qcard';

  var numEl = document.createElement('div');
  numEl.className = 'qnum';
  numEl.textContent = 'Питання ' + (mnt.q + 1) + ' з ' + total;
  wrap.appendChild(numEl);

  var txtEl = document.createElement('div');
  txtEl.className = 'qtxt';
  txtEl.textContent = q.text;
  wrap.appendChild(txtEl);

  if(q.sub){
    var subEl = document.createElement('div');
    subEl.className = 'qsub';
    subEl.textContent = q.sub;
    wrap.appendChild(subEl);
  }

  /* chips single */
  if(q.type === 'chips'){
    var grid = document.createElement('div');
    grid.className = 'chips';
    q.options.forEach(function(opt){
      var chip = document.createElement('button');
      chip.className = 'chip' + (mnt.answers[q.id] === opt ? ' sel' : '');
      chip.textContent = opt;
      chip.addEventListener('click', function(){
        grid.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('sel'); });
        chip.classList.add('sel');
        mnt.answers[q.id] = opt;
        setTimeout(function(){ mntNext(); }, 280);
      });
      grid.appendChild(chip);
    });
    wrap.appendChild(grid);

  /* text */
  } else if(q.type === 'text'){
    var ta = document.createElement('textarea');
    ta.className = 'inp';
    ta.placeholder = q.placeholder || '';
    ta.rows = 4;
    if(mnt.answers[q.id]) ta.value = mnt.answers[q.id];
    wrap.appendChild(ta);

    var isLastT = mnt.q === MENTOR_QUESTIONS.length - 1;
    var btnT = document.createElement('button');
    btnT.className = 'btn bp';
    btnT.textContent = isLastT ? 'Отримати розбір' : 'Далі';
    btnT.style.marginTop = '12px';
    btnT.addEventListener('click', function(){
      var val = ta.value.trim();
      if(!val){ showToast('Заповни поле'); return; }
      mnt.answers[q.id] = val;
      mntNext();
    });
    wrap.appendChild(btnT);

  /* chips-multi */
  } else if(q.type === 'chips-multi'){
    mnt.multi = mnt.answers[q.id] ? mnt.answers[q.id].split(', ') : [];
    var grid2 = document.createElement('div');
    grid2.className = 'chips';
    q.options.forEach(function(opt){
      var chip2 = document.createElement('button');
      chip2.className = 'chip' + (mnt.multi.indexOf(opt) >= 0 ? ' sel' : '');
      chip2.textContent = opt;
      chip2.addEventListener('click', function(){
        toggleMulti(mnt.multi, opt, q, grid2);
      });
      grid2.appendChild(chip2);
    });
    wrap.appendChild(grid2);

    var isLastM = mnt.q === MENTOR_QUESTIONS.length - 1;
    var btnM = document.createElement('button');
    btnM.className = 'btn bp';
    btnM.textContent = isLastM ? 'Отримати розбір' : 'Далі';
    btnM.style.marginTop = '12px';
    btnM.addEventListener('click', function(){
      if(!mnt.multi.length){ showToast('Обери хоча б один варіант'); return; }
      mnt.answers[q.id] = mnt.multi.join(', ');
      mntNext();
    });
    wrap.appendChild(btnM);
  }

  container.appendChild(wrap);

  if(mnt.q > 0){
    var nav = document.createElement('div');
    nav.className = 'bpair';
    nav.style.marginTop = '8px';
    var bk = document.createElement('button');
    bk.className = 'btn bg';
    bk.textContent = 'Назад';
    bk.style.flex = '1';
    bk.addEventListener('click', function(){ mnt.q--; mnt.multi=[]; renderMntQ(); });
    nav.appendChild(bk);
    container.appendChild(nav);
  }
}

function mntNext(){
  mnt.q++;
  if(mnt.q >= MENTOR_QUESTIONS.length){ mntGenResult(); }
  else { renderMntQ(); }
}

function mntGenResult(){
  document.getElementById('fl-q').innerHTML =
    '<div class="qcard ai-loading-card">'
    +'<div class="ai-loading-icon" aria-hidden="true">'+modGlyph('mentor')+'</div>'
    +'<div class="qtxt ai-loading-title">Розбираю твою ситуацію...</div>'
    +'<div class="qsub ai-loading-sub">Аналізую проблему, знаходжу причину і готую план — близько хвилини</div>'
    +'<div class="ai-loading-dots"><span></span><span></span><span></span></div>'
    +'<div class="ai-loading-steps" id="ai-loading-steps">'
    +'<div class="ai-step active" id="step-1">Аналізую ситуацію</div>'
    +'<div class="ai-step" id="step-2">Знаходжу справжню причину</div>'
    +'<div class="ai-step" id="step-3">Визначаю точку росту</div>'
    +'<div class="ai-step" id="step-4">Формую план і рекомендації</div>'
    +'</div>'
    +'</div>';
  document.getElementById('fl-prog').innerHTML = '';
  setVis('fl-r', false);

  var stepIdx = 1;
  var stepTimer = setInterval(function(){
    stepIdx++;
    if(stepIdx > 4){ clearInterval(stepTimer); return; }
    for(var i=1;i<=4;i++){
      var s = document.getElementById('step-'+i);
      if(!s) continue;
      if(i < stepIdx)        s.className = 'ai-step done';
      else if(i === stepIdx) s.className = 'ai-step active';
      else                   s.className = 'ai-step';
    }
  }, 6000);

  fetch(apiUrl('/api/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ module: 'mentor', answers: mnt.answers })
  })
  .then(function(r){ return r.json(); })
  .then(function(data){
    clearInterval(stepTimer);
    if(!data.ok){
      if(!stratShowRefusal(data)) stratShowError('mentor', data);
      return;
    }
    if(data.usage){
      S.usage.deep_used   = data.usage.deep_used   || 0;
      S.usage.short_used  = data.usage.short_used  || 0;
      S.usage.deep_left   = data.usage.deep_left   !== undefined ? data.usage.deep_left  : null;
      S.usage.short_left  = data.usage.short_left  !== undefined ? data.usage.short_left : null;
      S.subscription.deep_limit  = data.usage.deep_limit  !== undefined ? data.usage.deep_limit  : S.subscription.deep_limit;
      S.subscription.short_limit = data.usage.short_limit !== undefined ? data.usage.short_limit : S.subscription.short_limit;
    }
    S.strategies_count = (S.strategies_count || 0) + 1;
    animBars();
    renderState();
    mntShowResult(data.result, data.strategy_id);
  })
  .catch(function(err){
    clearInterval(stepTimer);
    console.error('[mntGenResult]', err);
    stratShowError('mentor');
  });
}

function mntShowResult(md, stratId){
  _lastStrategyId = stratId || null;
  _lastStrategyMd = md;
  setVis('fl-q', false);

  var sl = S.subscription.short_limit;
  var su = S.usage.short_used || 0;
  var shortLeft = (sl === null) ? null : Math.max(0, sl - su);
  var canAsk = (shortLeft === null || shortLeft > 0) && !!stratId;

  var r = document.getElementById('fl-r');
  setVis(r, true);
  r.innerHTML =
    '<div class="airesp">'
    +'<div class="aibadge"><span class="aibadge-glyph" aria-hidden="true">'+modGlyph('mentor')+'</span>'+escHtml(modName('mentor'))+'</div>'
    +COPY_BTN_HTML
    +'<div class="aitxt" id="mnt-result-body"></div>'
    +'</div>'
    +'<div class="res-actions">'
    +(canAsk
      ? '<button class="btn bp bsm" id="mnt-rfollowup">Задати питання'+(shortLeft!==null?' ('+shortLeft+')':'')+'</button>'
      : '<button class="btn bs bsm" id="mnt-rfollowup" disabled>Уточнень не лишилось</button>'
    )
    +'<div class="bpair">'
    +'<button class="btn bg bsm" id="mnt-rnew">Новий розбір</button>'
    +'<button class="btn bg bsm" id="mnt-rhome">Головна</button>'
    +'</div>'
    +'</div>'
    +'<div class="res-saved">Збережено в профілі</div>';

  document.getElementById('mnt-result-body').innerHTML = renderMarkdown(md);
  document.getElementById('mnt-rnew').addEventListener('click', function(){ askNicheThenGo('mentor'); });
  document.getElementById('mnt-rhome').addEventListener('click', function(){ show('home'); });
  var btnFu = document.getElementById('mnt-rfollowup');
  if(btnFu && canAsk) btnFu.addEventListener('click', function(){
    openFollowup(stratId, 'mentor', md);
  });
}


/* ══════════════════════════════════════════════
   МОДУЛЬ 4 — АНАЛІЗ БЛОГУ
   ══════════════════════════════════════════════ */

var BLOG_QUESTIONS = [
  {
    id:'blog_url',
    text:'Дай посилання на свій блог',
    sub:'Instagram, Telegram або YouTube',
    type:'text',
    placeholder:'Наприклад: instagram.com/your_name або t.me/your_channel'
  },
  {
    id:'product',
    text:'Що саме ти продаєш у блозі?',
    sub:'Можна обрати кілька',
    type:'chips-multi',
    options:['Консультації','Наставництво','Онлайн-курс','Групову програму','Діагностику / розбір','Послуги','Навчання нової професії','Поки нічого не продаю'],
    exclusive:['Поки нічого не продаю']
  },
  {
    id:'subscribers',
    text:'Скільки підписників у тебе зараз?',
    sub:'Допомагає визначити стадію розвитку блогу',
    type:'chips',
    options:['Менше 500','500–2 000','2 000–5 000','5 000–10 000','10 000–50 000','Більше 50 000']
  },
  {
    id:'goal',
    text:'Яка головна мета твого блогу?',
    sub:'Обери один варіант',
    type:'chips',
    options:['Продавати консультації','Продавати курси / продукти','Розвивати особистий бренд','Збільшити дохід з блогу','Набрати аудиторію','Почати монетизацію']
  },
  {
    id:'problem',
    text:'Яка головна проблема блогу зараз?',
    sub:'Можна обрати кілька',
    type:'chips-multi',
    options:['Мало підписників','Мало заявок і продажів','Мало реакцій і охоплень','Складно продавати','Не знаю про що писати','Немає системи і регулярності','Незрозуміло як упакувати блог']
  },
  {
    id:'content_type',
    text:'Який контент ти публікуєш найчастіше?',
    sub:'Можна обрати кілька',
    type:'chips-multi',
    options:['Сторіс — особисте','Сторіс — продажі','Reels / відео','Пости і тексти','Експертний контент','Корисний контент','Особисті історії']
  },
  {
    id:'audience',
    text:'Хто твоя цільова аудиторія?',
    sub:'Опиши коротко — хто ці люди і що шукають',
    type:'text',
    placeholder:'Наприклад: жінки 28–45, які хочуть змінити роботу і почати заробляти онлайн'
  }
];

/* Стан флоу аналізу блогу */
var blog = { answers:{}, q:0, multi:[] };

function goBlogMod(){
  blog.answers = {}; blog.q = 0; blog.multi = [];
  if(S.profile.niche) blog.answers.niche = S.profile.niche;
  document.getElementById('fl-title').textContent = modName('blog');
  setVis('fl-r', false);
  setVis('fl-q', true);
  show('mflow');
  renderBlogQ();
}

function renderBlogProg(){
  var total = BLOG_QUESTIONS.length, cur = blog.q;
  var h = '';
  for(var i=0;i<total;i++){
    if(i < cur)        h += '<div class="fp done"></div>';
    else if(i === cur) h += '<div class="fp cur wide"></div>';
    else               h += '<div class="fp"></div>';
  }
  document.getElementById('fl-prog').innerHTML = h;
}

function renderBlogQ(){
  renderBlogProg();
  var q     = BLOG_QUESTIONS[blog.q];
  var total = BLOG_QUESTIONS.length;
  var container = document.getElementById('fl-q');
  container.innerHTML = '';

  var wrap = document.createElement('div');
  wrap.className = 'qcard';

  var numEl = document.createElement('div');
  numEl.className = 'qnum';
  numEl.textContent = 'Питання ' + (blog.q + 1) + ' з ' + total;
  wrap.appendChild(numEl);

  var txtEl = document.createElement('div');
  txtEl.className = 'qtxt';
  txtEl.textContent = q.text;
  wrap.appendChild(txtEl);

  if(q.sub){
    var subEl = document.createElement('div');
    subEl.className = 'qsub';
    subEl.textContent = q.sub;
    wrap.appendChild(subEl);
  }

  /* chips single */
  if(q.type === 'chips'){
    var grid = document.createElement('div');
    grid.className = 'chips';
    q.options.forEach(function(opt){
      var chip = document.createElement('button');
      chip.className = 'chip' + (blog.answers[q.id] === opt ? ' sel' : '');
      chip.textContent = opt;
      chip.addEventListener('click', function(){
        grid.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('sel'); });
        chip.classList.add('sel');
        blog.answers[q.id] = opt;
        setTimeout(function(){ blogNext(); }, 280);
      });
      grid.appendChild(chip);
    });
    wrap.appendChild(grid);

  /* text */
  } else if(q.type === 'text'){
    var ta = document.createElement('textarea');
    ta.className = 'inp';
    ta.placeholder = q.placeholder || '';
    ta.rows = 3;
    if(blog.answers[q.id]) ta.value = blog.answers[q.id];
    wrap.appendChild(ta);

    var isLastT = blog.q === BLOG_QUESTIONS.length - 1;
    var btnT = document.createElement('button');
    btnT.className = 'btn bp';
    btnT.textContent = isLastT ? 'Отримати розбір' : 'Далі';
    btnT.style.marginTop = '12px';
    btnT.addEventListener('click', function(){
      var val = ta.value.trim();
      if(!val){ showToast('Заповни поле'); return; }
      blog.answers[q.id] = val;
      blogNext();
    });
    wrap.appendChild(btnT);

  /* chips-multi */
  } else if(q.type === 'chips-multi'){
    blog.multi = blog.answers[q.id] ? blog.answers[q.id].split(', ') : [];
    var grid2 = document.createElement('div');
    grid2.className = 'chips';
    q.options.forEach(function(opt){
      var chip2 = document.createElement('button');
      chip2.className = 'chip' + (blog.multi.indexOf(opt) >= 0 ? ' sel' : '');
      chip2.textContent = opt;
      chip2.addEventListener('click', function(){
        toggleMulti(blog.multi, opt, q, grid2);
      });
      grid2.appendChild(chip2);
    });
    wrap.appendChild(grid2);

    var isLastM = blog.q === BLOG_QUESTIONS.length - 1;
    var btnM = document.createElement('button');
    btnM.className = 'btn bp';
    btnM.textContent = isLastM ? 'Отримати розбір' : 'Далі';
    btnM.style.marginTop = '12px';
    btnM.addEventListener('click', function(){
      if(!blog.multi.length){ showToast('Обери хоча б один варіант'); return; }
      blog.answers[q.id] = blog.multi.join(', ');
      blogNext();
    });
    wrap.appendChild(btnM);
  }

  container.appendChild(wrap);

  if(blog.q > 0){
    var nav = document.createElement('div');
    nav.className = 'bpair';
    nav.style.marginTop = '8px';
    var bk = document.createElement('button');
    bk.className = 'btn bg';
    bk.textContent = 'Назад';
    bk.style.flex = '1';
    bk.addEventListener('click', function(){ blog.q--; blog.multi=[]; renderBlogQ(); });
    nav.appendChild(bk);
    container.appendChild(nav);
  }
}

function blogNext(){
  blog.q++;
  if(blog.q >= BLOG_QUESTIONS.length){ blogGenResult(); }
  else { renderBlogQ(); }
}

function blogGenResult(){
  document.getElementById('fl-q').innerHTML =
    '<div class="qcard ai-loading-card">'
    +'<div class="ai-loading-icon" aria-hidden="true">'+modGlyph('blog')+'</div>'
    +'<div class="qtxt ai-loading-title">Аналізую твій блог...</div>'
    +'<div class="qsub ai-loading-sub">Перевіряю позиціонування, контент і воронки — 2–3 хвилини</div>'
    +'<div class="ai-loading-dots"><span></span><span></span><span></span></div>'
    +'<div class="ai-loading-steps" id="ai-loading-steps">'
    +'<div class="ai-step active" id="step-1">Аналізую позиціонування</div>'
    +'<div class="ai-step" id="step-2">Перевіряю упаковку профілю</div>'
    +'<div class="ai-step" id="step-3">Аналізую контент і воронки</div>'
    +'<div class="ai-step" id="step-4">Формую рекомендації</div>'
    +'</div>'
    +'</div>';
  document.getElementById('fl-prog').innerHTML = '';
  setVis('fl-r', false);

  var stepIdx = 1;
  var stepTimer = setInterval(function(){
    stepIdx++;
    if(stepIdx > 4){ clearInterval(stepTimer); return; }
    for(var i=1;i<=4;i++){
      var s = document.getElementById('step-'+i);
      if(!s) continue;
      if(i < stepIdx)        s.className = 'ai-step done';
      else if(i === stepIdx) s.className = 'ai-step active';
      else                   s.className = 'ai-step';
    }
  }, 6000);

  fetch(apiUrl('/api/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ module: 'blog', answers: blog.answers })
  })
  .then(function(r){ return r.json(); })
  .then(function(data){
    clearInterval(stepTimer);
    if(!data.ok){
      if(!stratShowRefusal(data)) stratShowError('blog', data);
      return;
    }
    if(data.usage){
      S.usage.deep_used   = data.usage.deep_used   || 0;
      S.usage.short_used  = data.usage.short_used  || 0;
      S.usage.deep_left   = data.usage.deep_left   !== undefined ? data.usage.deep_left  : null;
      S.usage.short_left  = data.usage.short_left  !== undefined ? data.usage.short_left : null;
      S.subscription.deep_limit  = data.usage.deep_limit  !== undefined ? data.usage.deep_limit  : S.subscription.deep_limit;
      S.subscription.short_limit = data.usage.short_limit !== undefined ? data.usage.short_limit : S.subscription.short_limit;
    }
    S.strategies_count = (S.strategies_count || 0) + 1;
    animBars();
    renderState();
    blogShowResult(data.result, data.strategy_id);
  })
  .catch(function(err){
    clearInterval(stepTimer);
    console.error('[blogGenResult]', err);
    stratShowError('blog');
  });
}

function blogShowResult(md, stratId){
  _lastStrategyId = stratId || null;
  _lastStrategyMd = md;
  setVis('fl-q', false);

  var sl = S.subscription.short_limit;
  var su = S.usage.short_used || 0;
  var shortLeft = (sl === null) ? null : Math.max(0, sl - su);
  var canAsk = (shortLeft === null || shortLeft > 0) && !!stratId;

  var r = document.getElementById('fl-r');
  setVis(r, true);
  r.innerHTML =
    '<div class="airesp">'
    +'<div class="aibadge"><span class="aibadge-glyph" aria-hidden="true">'+modGlyph('blog')+'</span>'+escHtml(modName('blog'))+'</div>'
    +COPY_BTN_HTML
    +'<div class="aitxt" id="blog-result-body"></div>'
    +'</div>'
    +'<div class="res-actions">'
    +(canAsk
      ? '<button class="btn bp bsm" id="blog-rfollowup">Задати питання'+(shortLeft!==null?' ('+shortLeft+')':'')+'</button>'
      : '<button class="btn bs bsm" id="blog-rfollowup" disabled>Уточнень не лишилось</button>'
    )
    +'<div class="bpair">'
    +'<button class="btn bg bsm" id="blog-rnew">Новий розбір</button>'
    +'<button class="btn bg bsm" id="blog-rhome">Головна</button>'
    +'</div>'
    +'</div>'
    +'<div class="res-saved">Збережено в профілі</div>';

  document.getElementById('blog-result-body').innerHTML = renderMarkdown(md);
  document.getElementById('blog-rnew').addEventListener('click', function(){ askNicheThenGo('blog'); });
  document.getElementById('blog-rhome').addEventListener('click', function(){ show('home'); });
  var btnFu = document.getElementById('blog-rfollowup');
  if(btnFu && canAsk) btnFu.addEventListener('click', function(){
    openFollowup(stratId, 'blog', md);
  });
}


/* ══════════════════════════════════════════════
   МОДУЛЬ 3 — КОНТЕНТ-МИСЛЕННЯ
   ══════════════════════════════════════════════ */

var CONTENT_QUESTIONS = [
  {
    id:'product',
    text:'Який твій основний продукт або послуга?',
    sub:'Що саме продає твій блог — можна обрати кілька',
    type:'chips-multi',
    options:['Консультації','Наставництво','Онлайн-курс','Групова програма','Діагностика / розбір','Послуги (б\'юті, дизайн тощо)','Навчання нової професії','Особистий бренд без прямого продукту'],
    exclusive:['Особистий бренд без прямого продукту']
  },
  {
    id:'audience',
    text:'Для кого твій блог?',
    sub:'Опиши свою цільову аудиторію — хто вона, яка ситуація, що шукає',
    type:'text',
    placeholder:'Наприклад: жінки 30–45, які хочуть вийти з найму і почати заробляти онлайн, але не знають з чого почати'
  },
  {
    id:'problem',
    text:'Яку головну проблему ти допомагаєш вирішити людям?',
    sub:'Один конкретний результат або зміна в житті клієнта',
    type:'text',
    placeholder:'Наприклад: знайти своє позиціонування і почати отримувати заявки через блог'
  },
  {
    id:'current_topics',
    text:'Які теми ти зараз найчастіше публікуєш?',
    sub:'Що вже є в блозі — будь-яким словами',
    type:'text',
    placeholder:'Наприклад: корисні поради, особисті пости, рідко продаю, іноді кейси'
  },
  {
    id:'challenge',
    text:'Що тобі найскладніше у веденні блогу?',
    sub:'Можна обрати кілька',
    type:'chips-multi',
    options:['Не знаю про що писати','Немає ідей для Reels','Боюся проявлятися','Складно продавати через контент','Мало реакцій і охоплень','Немає системи і регулярності','Не можу поєднати користь і продаж']
  },
  {
    /* Тут «Комбінація форматів» серед варіантів була симптомом: питання вже
       хотіло бути мультивибором, і одиничний вибір милицею це визнавав.
       Тепер комбінація виражається самим вибором кількох, тому окремий
       варіант прибрано — інакше «Сторіс + Комбінація форматів» читалось би
       як два різні твердження про одне й те саме. */
    id:'format',
    text:'Який формат контенту тобі ближчий?',
    sub:'Що комфортніше і природніше — можна обрати кілька',
    type:'chips-multi',
    options:['Сторіс','Reels / відео','Пости і тексти','Каруселі','Особисті історії','Експертні розбори']
  }
];

/* Стан флоу контент-мислення */
var cont = { answers:{}, q:0, multi:[] };

function goContentMod(){
  cont.answers = {}; cont.q = 0; cont.multi = [];
  if(S.profile.niche) cont.answers.niche = S.profile.niche;
  document.getElementById('fl-title').textContent = modName('content');
  setVis('fl-r', false);
  setVis('fl-q', true);
  show('mflow');
  renderContQ();
}

function renderContProg(){
  var total = CONTENT_QUESTIONS.length, cur = cont.q;
  var h = '';
  for(var i=0;i<total;i++){
    if(i < cur)        h += '<div class="fp done"></div>';
    else if(i === cur) h += '<div class="fp cur wide"></div>';
    else               h += '<div class="fp"></div>';
  }
  document.getElementById('fl-prog').innerHTML = h;
}

function renderContQ(){
  renderContProg();
  var q     = CONTENT_QUESTIONS[cont.q];
  var total = CONTENT_QUESTIONS.length;
  var container = document.getElementById('fl-q');
  container.innerHTML = '';

  var wrap = document.createElement('div');
  wrap.className = 'qcard';

  var numEl = document.createElement('div');
  numEl.className = 'qnum';
  numEl.textContent = 'Питання ' + (cont.q + 1) + ' з ' + total;
  wrap.appendChild(numEl);

  var txtEl = document.createElement('div');
  txtEl.className = 'qtxt';
  txtEl.textContent = q.text;
  wrap.appendChild(txtEl);

  if(q.sub){
    var subEl = document.createElement('div');
    subEl.className = 'qsub';
    subEl.textContent = q.sub;
    wrap.appendChild(subEl);
  }

  /* chips — single */
  if(q.type === 'chips'){
    var grid = document.createElement('div');
    grid.className = 'chips';
    q.options.forEach(function(opt){
      var chip = document.createElement('button');
      chip.className = 'chip' + (cont.answers[q.id] === opt ? ' sel' : '');
      chip.textContent = opt;
      chip.addEventListener('click', function(){
        grid.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('sel'); });
        chip.classList.add('sel');
        cont.answers[q.id] = opt;
        setTimeout(function(){ contNext(); }, 280);
      });
      grid.appendChild(chip);
    });
    wrap.appendChild(grid);

  /* text */
  } else if(q.type === 'text'){
    var ta = document.createElement('textarea');
    ta.className = 'inp';
    ta.placeholder = q.placeholder || '';
    ta.rows = 3;
    if(cont.answers[q.id]) ta.value = cont.answers[q.id];
    wrap.appendChild(ta);

    var isLastT = cont.q === CONTENT_QUESTIONS.length - 1;
    var btnT = document.createElement('button');
    btnT.className = 'btn bp';
    btnT.textContent = isLastT ? 'Отримати розбір' : 'Далі';
    btnT.style.marginTop = '12px';
    btnT.addEventListener('click', function(){
      var val = ta.value.trim();
      if(!val){ showToast('Заповни поле'); return; }
      cont.answers[q.id] = val;
      contNext();
    });
    wrap.appendChild(btnT);

  /* chips-multi */
  } else if(q.type === 'chips-multi'){
    cont.multi = cont.answers[q.id] ? cont.answers[q.id].split(', ') : [];
    var grid2 = document.createElement('div');
    grid2.className = 'chips';
    q.options.forEach(function(opt){
      var chip2 = document.createElement('button');
      chip2.className = 'chip' + (cont.multi.indexOf(opt) >= 0 ? ' sel' : '');
      chip2.textContent = opt;
      chip2.addEventListener('click', function(){
        toggleMulti(cont.multi, opt, q, grid2);
      });
      grid2.appendChild(chip2);
    });
    wrap.appendChild(grid2);

    var isLastM = cont.q === CONTENT_QUESTIONS.length - 1;
    var btnM = document.createElement('button');
    btnM.className = 'btn bp';
    btnM.textContent = isLastM ? 'Отримати розбір' : 'Далі';
    btnM.style.marginTop = '12px';
    btnM.addEventListener('click', function(){
      if(!cont.multi.length){ showToast('Обери хоча б один варіант'); return; }
      cont.answers[q.id] = cont.multi.join(', ');
      contNext();
    });
    wrap.appendChild(btnM);
  }

  container.appendChild(wrap);

  if(cont.q > 0){
    var nav = document.createElement('div');
    nav.className = 'bpair';
    nav.style.marginTop = '8px';
    var bk = document.createElement('button');
    bk.className = 'btn bg';
    bk.textContent = 'Назад';
    bk.style.flex = '1';
    bk.addEventListener('click', function(){ cont.q--; cont.multi=[]; renderContQ(); });
    nav.appendChild(bk);
    container.appendChild(nav);
  }
}

function contNext(){
  cont.q++;
  if(cont.q >= CONTENT_QUESTIONS.length){ contGenResult(); }
  else { renderContQ(); }
}

function contGenResult(){
  document.getElementById('fl-q').innerHTML =
    '<div class="qcard ai-loading-card">'
    +'<div class="ai-loading-icon" aria-hidden="true">'+modGlyph('content')+'</div>'
    +'<div class="qtxt ai-loading-title">Будую твоє контент-мислення...</div>'
    +'<div class="qsub ai-loading-sub">Аналізую нішу, аудиторію і формую систему блогу — 2–3 хвилини</div>'
    +'<div class="ai-loading-dots"><span></span><span></span><span></span></div>'
    +'<div class="ai-loading-steps" id="ai-loading-steps">'
    +'<div class="ai-step active" id="step-1">Аналізую нішу і продукт</div>'
    +'<div class="ai-step" id="step-2">Визначаю логіку блогу</div>'
    +'<div class="ai-step" id="step-3">Формую рубрики і напрямки</div>'
    +'<div class="ai-step" id="step-4">Генерую теми і рекомендації</div>'
    +'</div>'
    +'</div>';
  document.getElementById('fl-prog').innerHTML = '';
  setVis('fl-r', false);

  var stepIdx = 1;
  var stepTimer = setInterval(function(){
    stepIdx++;
    if(stepIdx > 4){ clearInterval(stepTimer); return; }
    for(var i=1;i<=4;i++){
      var s = document.getElementById('step-'+i);
      if(!s) continue;
      if(i < stepIdx)        s.className = 'ai-step done';
      else if(i === stepIdx) s.className = 'ai-step active';
      else                   s.className = 'ai-step';
    }
  }, 6000);

  fetch(apiUrl('/api/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ module: 'content', answers: cont.answers })
  })
  .then(function(r){ return r.json(); })
  .then(function(data){
    clearInterval(stepTimer);
    if(!data.ok){
      if(!stratShowRefusal(data)) stratShowError('content', data);
      return;
    }
    if(data.usage){
      S.usage.deep_used   = data.usage.deep_used   || 0;
      S.usage.short_used  = data.usage.short_used  || 0;
      S.usage.deep_left   = data.usage.deep_left   !== undefined ? data.usage.deep_left  : null;
      S.usage.short_left  = data.usage.short_left  !== undefined ? data.usage.short_left : null;
      S.subscription.deep_limit  = data.usage.deep_limit  !== undefined ? data.usage.deep_limit  : S.subscription.deep_limit;
      S.subscription.short_limit = data.usage.short_limit !== undefined ? data.usage.short_limit : S.subscription.short_limit;
    }
    S.strategies_count = (S.strategies_count || 0) + 1;
    animBars();
    renderState();
    contShowResult(data.result, data.strategy_id);
  })
  .catch(function(err){
    clearInterval(stepTimer);
    console.error('[contGenResult]', err);
    stratShowError('content');
  });
}

function contShowResult(md, stratId){
  _lastStrategyId = stratId || null;
  _lastStrategyMd = md;
  setVis('fl-q', false);

  var sl = S.subscription.short_limit;
  var su = S.usage.short_used || 0;
  var shortLeft = (sl === null) ? null : Math.max(0, sl - su);
  var canAsk = (shortLeft === null || shortLeft > 0) && !!stratId;

  var r = document.getElementById('fl-r');
  setVis(r, true);
  r.innerHTML =
    '<div class="airesp">'
    +'<div class="aibadge"><span class="aibadge-glyph" aria-hidden="true">'+modGlyph('content')+'</span>'+escHtml(modName('content'))+'</div>'
    +COPY_BTN_HTML
    +'<div class="aitxt" id="cont-result-body"></div>'
    +'</div>'
    +'<div class="res-actions">'
    +(canAsk
      ? '<button class="btn bp bsm" id="cont-rfollowup">Задати питання'+(shortLeft!==null?' ('+shortLeft+')':'')+'</button>'
      : '<button class="btn bs bsm" id="cont-rfollowup" disabled>Уточнень не лишилось</button>'
    )
    +'<div class="bpair">'
    +'<button class="btn bg bsm" id="cont-rnew">Новий розбір</button>'
    +'<button class="btn bg bsm" id="cont-rhome">Головна</button>'
    +'</div>'
    +'</div>'
    +'<div class="res-saved">Збережено в профілі</div>';

  document.getElementById('cont-result-body').innerHTML = renderMarkdown(md);
  document.getElementById('cont-rnew').addEventListener('click', function(){ askNicheThenGo('content'); });
  document.getElementById('cont-rhome').addEventListener('click', function(){ show('home'); });
  var btnFu = document.getElementById('cont-rfollowup');
  if(btnFu && canAsk) btnFu.addEventListener('click', function(){
    openFollowup(stratId, 'content', md);
  });
}


/* ══════════════════════════════════════════════
   МОДУЛЬ 2 — ПРОГРІВИ
   ══════════════════════════════════════════════ */

var WARMUPS_QUESTIONS = [
  {
    /* Мультивибір тут не про «продаю багато всього», а про звʼязку: КЕВ —
       це не окремий продукт, а спосіб продати курс. «Онлайн-курс + КЕВ»
       описує один запуск точніше, ніж будь-який з них окремо. */
    id:'product',
    text:'Що саме ти продаєш?',
    sub:'Можна обрати кілька',
    type:'chips-multi',
    options:['Консультацію','Діагностику','Розбір','Онлайн-курс','Наставництво','Групову програму','Новий продукт','КЕВ (вебінар, марафон, стратсесія)']
  },
  {
    id:'price',
    text:'Яка ціна продукту?',
    sub:'Допомагає визначити логіку прогріву',
    type:'chips',
    options:['До $50','$50–$200','$200–$500','$500–$1500','$1500–$3000','Більше $3000']
  },
  {
    id:'audience',
    text:'Для кого цей продукт?',
    sub:'Опиши свою аудиторію — хто вона, яка ситуація, чого хоче',
    type:'text',
    placeholder:'Наприклад: жінки-експерти 28–45, які хочуть запустити курс але не знають як зібрати аудиторію'
  },
  {
    id:'problem',
    text:'Яку головну проблему вирішує твій продукт?',
    sub:'Один головний результат, який отримає клієнт',
    type:'text',
    placeholder:'Наприклад: навчитись продавати через сторіс без відчуття що продаю'
  },
  {
    id:'doubts',
    text:'Які головні сумніви є у клієнтів перед покупкою?',
    sub:'Можна обрати кілька',
    type:'chips-multi',
    options:['Не впевнені в результаті','Дорого','Немає часу','Вже пробували — не вийшло','Не розуміють чи підходить для них','Бояться що не впораються']
  },
  {
    id:'duration',
    text:'Скільки днів триватиме прогрів?',
    sub:'Від цього залежить структура по днях',
    type:'chips',
    options:['3 дні','5 днів','7 днів','10 днів','14 днів','21–30 днів']
  },
  {
    id:'platform',
    text:'Де будеш робити прогрів?',
    sub:'Можна обрати кілька',
    type:'chips-multi',
    options:['Instagram (сторіс)','Instagram (Reels)','Telegram-канал','YouTube','Змішаний формат']
  },
  {
    /* Підпис обіцяв «один або комбінацію», а type:'chips' давав рівно один:
       копія і поведінка суперечили одна одній, і програвала копія. Варіант
       «Змішаний» разом з одиничним вибором був єдиним способом сказати
       «кілька» — тепер це робиться прямо, тож він зайвий. */
    id:'style',
    text:'Який стиль прогріву тобі ближчий?',
    sub:'Можна обрати кілька',
    type:'chips-multi',
    options:['Експертний','Особистий','Провокаційний','Через кейси клієнтів']
  }
];

/* Стан флоу прогрівів */
var warm = { answers:{}, q:0, multi:[] };

function goWarmupsMod(){
  warm.answers = {}; warm.q = 0; warm.multi = [];
  document.getElementById('fl-title').textContent = modName('warmups');
  setVis('fl-r', false);
  setVis('fl-q', true);
  show('mflow');
  renderWarmQ();
}

function renderWarmProg(){
  var total = WARMUPS_QUESTIONS.length, cur = warm.q;
  var h = '';
  for(var i=0;i<total;i++){
    if(i < cur)        h += '<div class="fp done"></div>';
    else if(i === cur) h += '<div class="fp cur wide"></div>';
    else               h += '<div class="fp"></div>';
  }
  document.getElementById('fl-prog').innerHTML = h;
}

function renderWarmQ(){
  renderWarmProg();
  var q     = WARMUPS_QUESTIONS[warm.q];
  var total = WARMUPS_QUESTIONS.length;
  var container = document.getElementById('fl-q');
  container.innerHTML = '';

  var wrap = document.createElement('div');
  wrap.className = 'qcard';

  var numEl = document.createElement('div');
  numEl.className = 'qnum';
  numEl.textContent = 'Питання ' + (warm.q + 1) + ' з ' + total;
  wrap.appendChild(numEl);

  var txtEl = document.createElement('div');
  txtEl.className = 'qtxt';
  txtEl.textContent = q.text;
  wrap.appendChild(txtEl);

  if(q.sub){
    var subEl = document.createElement('div');
    subEl.className = 'qsub';
    subEl.textContent = q.sub;
    wrap.appendChild(subEl);
  }

  /* chips — single select */
  if(q.type === 'chips'){
    var grid = document.createElement('div');
    grid.className = 'chips';
    q.options.forEach(function(opt){
      var chip = document.createElement('button');
      chip.className = 'chip' + (warm.answers[q.id] === opt ? ' sel' : '');
      chip.textContent = opt;
      chip.addEventListener('click', function(){
        grid.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('sel'); });
        chip.classList.add('sel');
        warm.answers[q.id] = opt;
        setTimeout(function(){ warmNext(); }, 280);
      });
      grid.appendChild(chip);
    });
    wrap.appendChild(grid);

  /* text */
  } else if(q.type === 'text'){
    var ta = document.createElement('textarea');
    ta.className = 'inp';
    ta.placeholder = q.placeholder || '';
    ta.rows = 3;
    if(warm.answers[q.id]) ta.value = warm.answers[q.id];
    wrap.appendChild(ta);

    var isLastT = warm.q === WARMUPS_QUESTIONS.length - 1;
    var btnT = document.createElement('button');
    btnT.className = 'btn bp';
    btnT.textContent = isLastT ? 'Отримати розбір' : 'Далі';
    btnT.style.marginTop = '12px';
    btnT.addEventListener('click', function(){
      var val = ta.value.trim();
      if(!val){ showToast('Заповни поле'); return; }
      warm.answers[q.id] = val;
      warmNext();
    });
    wrap.appendChild(btnT);

  /* chips-multi */
  } else if(q.type === 'chips-multi'){
    warm.multi = warm.answers[q.id] ? warm.answers[q.id].split(', ') : [];
    var grid2 = document.createElement('div');
    grid2.className = 'chips';
    q.options.forEach(function(opt){
      var chip2 = document.createElement('button');
      chip2.className = 'chip' + (warm.multi.indexOf(opt) >= 0 ? ' sel' : '');
      chip2.textContent = opt;
      chip2.addEventListener('click', function(){
        toggleMulti(warm.multi, opt, q, grid2);
      });
      grid2.appendChild(chip2);
    });
    wrap.appendChild(grid2);

    var isLastM = warm.q === WARMUPS_QUESTIONS.length - 1;
    var btnM = document.createElement('button');
    btnM.className = 'btn bp';
    btnM.textContent = isLastM ? 'Отримати розбір' : 'Далі';
    btnM.style.marginTop = '12px';
    btnM.addEventListener('click', function(){
      if(!warm.multi.length){ showToast('Обери хоча б один варіант'); return; }
      warm.answers[q.id] = warm.multi.join(', ');
      warmNext();
    });
    wrap.appendChild(btnM);
  }

  container.appendChild(wrap);

  /* Кнопка «Назад» */
  if(warm.q > 0){
    var nav = document.createElement('div');
    nav.className = 'bpair';
    nav.style.marginTop = '8px';
    var bk = document.createElement('button');
    bk.className = 'btn bg';
    bk.textContent = 'Назад';
    bk.style.flex = '1';
    bk.addEventListener('click', function(){ warm.q--; warm.multi=[]; renderWarmQ(); });
    nav.appendChild(bk);
    container.appendChild(nav);
  }
}

function warmNext(){
  warm.q++;
  if(warm.q >= WARMUPS_QUESTIONS.length){ warmGenResult(); }
  else { renderWarmQ(); }
}

function warmGenResult(){
  document.getElementById('fl-q').innerHTML =
    '<div class="qcard ai-loading-card">'
    +'<div class="ai-loading-icon" aria-hidden="true">'+modGlyph('warmups')+'</div>'
    +'<div class="qtxt ai-loading-title">Будую твій прогрів...</div>'
    +'<div class="qsub ai-loading-sub">Аналізую продукт, аудиторію і підбираю структуру — 2–3 хвилини</div>'
    +'<div class="ai-loading-dots"><span></span><span></span><span></span></div>'
    +'<div class="ai-loading-steps" id="ai-loading-steps">'
    +'<div class="ai-step active" id="step-1">Аналізую продукт і аудиторію</div>'
    +'<div class="ai-step" id="step-2">Визначаю тип прогріву</div>'
    +'<div class="ai-step" id="step-3">Будую матрицю по днях</div>'
    +'<div class="ai-step" id="step-4">Генерую сторіс, Reels і CTA</div>'
    +'</div>'
    +'</div>';
  document.getElementById('fl-prog').innerHTML = '';
  setVis('fl-r', false);

  var stepIdx = 1;
  var stepTimer = setInterval(function(){
    stepIdx++;
    if(stepIdx > 4){ clearInterval(stepTimer); return; }
    for(var i=1;i<=4;i++){
      var s = document.getElementById('step-'+i);
      if(!s) continue;
      if(i < stepIdx)        s.className = 'ai-step done';
      else if(i === stepIdx) s.className = 'ai-step active';
      else                   s.className = 'ai-step';
    }
  }, 6000);

  fetch(apiUrl('/api/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ module: 'warmups', answers: warm.answers })
  })
  .then(function(r){ return r.json(); })
  .then(function(data){
    clearInterval(stepTimer);
    if(!data.ok){
      if(!stratShowRefusal(data)) stratShowError('warmups', data);
      return;
    }
    if(data.usage){
      S.usage.deep_used   = data.usage.deep_used   || 0;
      S.usage.short_used  = data.usage.short_used  || 0;
      S.usage.deep_left   = data.usage.deep_left   !== undefined ? data.usage.deep_left  : null;
      S.usage.short_left  = data.usage.short_left  !== undefined ? data.usage.short_left : null;
      S.subscription.deep_limit  = data.usage.deep_limit  !== undefined ? data.usage.deep_limit  : S.subscription.deep_limit;
      S.subscription.short_limit = data.usage.short_limit !== undefined ? data.usage.short_limit : S.subscription.short_limit;
    }
    S.strategies_count = (S.strategies_count || 0) + 1;
    animBars();
    renderState();
    warmShowResult(data.result, data.strategy_id);
  })
  .catch(function(err){
    clearInterval(stepTimer);
    console.error('[warmGenResult]', err);
    stratShowError('warmups');
  });
}

function warmShowResult(md, stratId){
  _lastStrategyId = stratId || null;
  _lastStrategyMd = md;
  setVis('fl-q', false);

  var sl = S.subscription.short_limit;
  var su = S.usage.short_used || 0;
  var shortLeft = (sl === null) ? null : Math.max(0, sl - su);
  var canAsk = (shortLeft === null || shortLeft > 0) && !!stratId;

  var r = document.getElementById('fl-r');
  setVis(r, true);
  r.innerHTML =
    '<div class="airesp">'
    +'<div class="aibadge"><span class="aibadge-glyph" aria-hidden="true">'+modGlyph('warmups')+'</span>'+escHtml(modName('warmups'))+'</div>'
    +COPY_BTN_HTML
    +'<div class="aitxt" id="warm-result-body"></div>'
    +'</div>'
    +'<div class="res-actions">'
    +(canAsk
      ? '<button class="btn bp bsm" id="warm-rfollowup">Задати питання'+(shortLeft!==null?' ('+shortLeft+')':'')+'</button>'
      : '<button class="btn bs bsm" id="warm-rfollowup" disabled>Уточнень не лишилось</button>'
    )
    +'<div class="bpair">'
    +'<button class="btn bg bsm" id="warm-rnew">Новий розбір</button>'
    +'<button class="btn bg bsm" id="warm-rhome">Головна</button>'
    +'</div>'
    +'</div>'
    +'<div class="res-saved">Збережено в профілі</div>';

  document.getElementById('warm-result-body').innerHTML = renderMarkdown(md);
  document.getElementById('warm-rnew').addEventListener('click', function(){ goWarmupsMod(); });
  document.getElementById('warm-rhome').addEventListener('click', function(){ show('home'); });
  var btnFu = document.getElementById('warm-rfollowup');
  if(btnFu && canAsk) btnFu.addEventListener('click', function(){
    openFollowup(stratId, 'warmups', md);
  });
}


function goStrategyMod(){
  strat.answers = {}; strat.q = 0; strat.multi = [];
  if(S.profile.niche) strat.answers.niche = S.profile.niche;
  document.getElementById('fl-title').textContent = modName('strategy');
  setVis('fl-r', false);
  setVis('fl-q', true);
  show('mflow');
  renderStratQ();
}

function renderStratProg(){
  var total = STRATEGY_QUESTIONS.length, cur = strat.q;
  var h = '';
  for(var i=0;i<total;i++){
    if(i < cur)       h += '<div class="fp done"></div>';
    else if(i === cur) h += '<div class="fp cur wide"></div>';
    else               h += '<div class="fp"></div>';
  }
  document.getElementById('fl-prog').innerHTML = h;
}

function renderStratQ(){
  renderStratProg();
  var q = STRATEGY_QUESTIONS[strat.q];
  var total = STRATEGY_QUESTIONS.length;
  var container = document.getElementById('fl-q');
  container.innerHTML = '';

  var wrap = document.createElement('div');
  wrap.className = 'qcard';

  /* Заголовок */
  var numEl = document.createElement('div');
  numEl.className = 'qnum';
  numEl.textContent = 'Питання ' + (strat.q + 1) + ' з ' + total;
  wrap.appendChild(numEl);

  var txtEl = document.createElement('div');
  txtEl.className = 'qtxt';
  txtEl.textContent = q.text;
  wrap.appendChild(txtEl);

  if(q.sub){
    var subEl = document.createElement('div');
    subEl.className = 'qsub';
    subEl.textContent = q.sub;
    wrap.appendChild(subEl);
  }

  /* Chips (одиночний вибір) */
  if(q.type === 'chips'){
    var grid = document.createElement('div');
    grid.className = 'chips-grid';

    q.options.forEach(function(opt){
      var chip = document.createElement('button');
      chip.className = 'chip';
      chip.textContent = opt;
      var isCustom = opt.toLowerCase().indexOf('інш') >= 0;

      chip.addEventListener('click', function(){
        /* зняти вибір з інших */
        grid.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('sel'); });
        chip.classList.add('sel');

        var customRow = wrap.querySelector('.custom-row');
        if(isCustom){
          /* показати поле для введення */
          if(customRow) setVis(customRow, true);
        } else {
          if(customRow) setVis(customRow, false);
          strat.answers[q.id] = opt;
          /* авто-перехід через 280мс */
          setTimeout(function(){ stratNext(); }, 280);
        }
      });

      grid.appendChild(chip);
    });
    wrap.appendChild(grid);

    /* Поле «Інше» */
    var customRow = document.createElement('div');
    customRow.className = 'custom-row';
    setVis(customRow, false);
    customRow.innerHTML =
      '<textarea class="inp" id="strat-custom" placeholder="Напиши свій варіант..." rows="2" style="margin-top:10px"></textarea>';
    wrap.appendChild(customRow);

    container.appendChild(wrap);

    /* Кнопки навігації */
    container.appendChild(buildStratNavBtns(function(){
      /* Перевірити чи обрано чіп або введено текст */
      var sel = grid.querySelector('.chip.sel');
      if(!sel){ showToast('Обери або введи варіант'); return; }
      var isCustomChip = sel.textContent.toLowerCase().indexOf('інш') >= 0;
      if(isCustomChip){
        var val = (document.getElementById('strat-custom')||{value:''}).value.trim();
        if(!val){ showToast('Напиши свій варіант'); return; }
        strat.answers[q.id] = val;
      }
      stratNext();
    }));
  }

  /* Текстове поле */
  else if(q.type === 'text'){
    var ta = document.createElement('textarea');
    ta.className = 'inp';
    ta.id = 'strat-ta';
    ta.placeholder = q.placeholder || '';
    ta.rows = 4;
    ta.style.marginTop = '10px';
    if(strat.answers[q.id]) ta.value = strat.answers[q.id];
    wrap.appendChild(ta);
    container.appendChild(wrap);
    container.appendChild(buildStratNavBtns(function(){
      var val = (document.getElementById('strat-ta')||{value:''}).value.trim();
      if(!val){ showToast('Напиши відповідь'); return; }
      strat.answers[q.id] = val;
      stratNext();
    }));
    setTimeout(function(){ var el=document.getElementById('strat-ta'); if(el) el.focus(); }, 180);
  }

  /* Chips мультивибір */
  else if(q.type === 'chips-multi'){
    /* Відновлюємо попередній вибір із answers, як і решта чотирьох анкет.
       Тут стояло `strat.multi = []` без відновлення: «Назад» стирало
       вибір, і повернувшись, користувач бачив порожнє питання, на яке
       щойно відповів. Поки мультивибір був лише останнім питанням, до
       нього рідко верталися; тепер ним стало перше — і кожен, хто
       натисне «Назад», пройде через цю дірку. */
    strat.multi = strat.answers[q.id] ? strat.answers[q.id].split(', ') : [];
    var grid2 = document.createElement('div');
    grid2.className = 'chips-grid';
    q.options.forEach(function(opt){
      var chip = document.createElement('button');
      chip.className = 'chip' + (strat.multi.indexOf(opt) >= 0 ? ' sel' : '');
      chip.textContent = opt;
      chip.addEventListener('click', function(){
        toggleMulti(strat.multi, opt, q, grid2);
      });
      grid2.appendChild(chip);
    });
    wrap.appendChild(grid2);
    container.appendChild(wrap);
    container.appendChild(buildStratNavBtns(function(){
      if(!strat.multi.length){ showToast('Обери хоча б один варіант'); return; }
      strat.answers[q.id] = strat.multi.join(', ');
      stratNext();
    }));
  }
}

/* Будує рядок кнопок Назад / Далі */
function buildStratNavBtns(onNext){
  var row = document.createElement('div');
  row.className = 'bpair';
  row.style.marginTop = '16px';

  var isLast = strat.q === STRATEGY_QUESTIONS.length - 1;

  if(strat.q > 0){
    var bk = document.createElement('button');
    bk.className = 'btn bg';
    bk.style.flex = '1';
    bk.textContent = 'Назад';
    bk.addEventListener('click', function(){ strat.q--; strat.multi=[]; renderStratQ(); });
    row.appendChild(bk);
  }

  var nx = document.createElement('button');
  nx.className = 'btn bp';
  nx.style.flex = '2';
  nx.textContent = isLast ? 'Отримати розбір' : 'Далі';
  nx.addEventListener('click', onNext);
  row.appendChild(nx);

  return row;
}

function stratNext(){
  strat.q++;
  if(strat.q >= STRATEGY_QUESTIONS.length){ stratGenResult(); }
  else { renderStratQ(); }
}

/* Генерація результату через Anthropic API */
function stratGenResult(){
  /* ── Анімація очікування ── */
  document.getElementById('fl-q').innerHTML =
    '<div class="qcard ai-loading-card">'
    +'<div class="ai-loading-icon" aria-hidden="true">'+modGlyph('strategy')+'</div>'
    +'<div class="qtxt ai-loading-title">Аналізую твою нішу...</div>'
    +'<div class="qsub ai-loading-sub">Формую персональну стратегію — це займає 1–2 хвилини</div>'
    +'<div class="ai-loading-dots"><span></span><span></span><span></span></div>'
    +'<div class="ai-loading-steps" id="ai-loading-steps">'
    +'<div class="ai-step active" id="step-1">Визначаю тип ніші</div>'
    +'<div class="ai-step" id="step-2">Аналізую продукт і ЦА</div>'
    +'<div class="ai-step" id="step-3">Ставлю діагноз</div>'
    +'<div class="ai-step" id="step-4">Будую стратегію</div>'
    +'</div>'
    +'</div>';
  document.getElementById('fl-prog').innerHTML = '';
  setVis('fl-r', false);

  /* ── Анімація кроків ── */
  var stepIdx = 1;
  var stepTimer = setInterval(function(){
    stepIdx++;
    if(stepIdx > 4){ clearInterval(stepTimer); return; }
    for(var i=1;i<=4;i++){
      var s = document.getElementById('step-'+i);
      if(!s) continue;
      if(i < stepIdx)       s.className = 'ai-step done';
      else if(i === stepIdx) s.className = 'ai-step active';
      else                   s.className = 'ai-step';
    }
  }, 5000);

  /* ── Виклик бекенду ── */
  fetch(apiUrl('/api/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      module:  'strategy',
      answers: strat.answers
    })
  })
  .then(function(r){ return r.json(); })
  .then(function(data){
    clearInterval(stepTimer);
    if(!data.ok){
      /* Перевіряємо чи це помилка ліміту */
      if(!stratShowRefusal(data)) stratShowError('strategy', data);
      return;
    }
    /* Оновлюємо лічильник з відповіді бекенду */
    if(data.deep_used !== undefined) S.usage.deep_used = data.deep_used;
    if(data.deep_limit !== undefined) S.subscription.deep_limit = data.deep_limit;
    S.strategies_count = (S.strategies_count || 0) + 1;
    if(data.usage){
      S.usage.deep_used  = data.usage.deep_used  || 0;
      S.usage.short_used = data.usage.short_used || 0;
      S.usage.deep_left  = data.usage.deep_left  !== undefined ? data.usage.deep_left  : null;
      S.usage.short_left = data.usage.short_left !== undefined ? data.usage.short_left : null;
      S.subscription.deep_limit  = data.usage.deep_limit  !== undefined ? data.usage.deep_limit  : S.subscription.deep_limit;
      S.subscription.short_limit = data.usage.short_limit !== undefined ? data.usage.short_limit : S.subscription.short_limit;
    }
    animBars();
    renderState();
    stratShowResult(data.result, data.strategy_id);
  })
  .catch(function(err){
    clearInterval(stepTimer);
    console.error('[stratGenResult]', err);
    stratShowError('strategy');
  });
}

var _lastStrategyId = null;
var _lastStrategyMd = null;

/* Рендер готової стратегії + кнопка уточнень */
function stratShowResult(md, stratId){
  _lastStrategyId = stratId || null;
  _lastStrategyMd = md;
  setVis('fl-q', false);

  var sl = S.subscription.short_limit;
  var su = S.usage.short_used || 0;
  var shortLeft = (sl===null) ? null : Math.max(0, sl-su);
  var canAsk = (shortLeft===null || shortLeft>0) && !!stratId;

  var r = document.getElementById('fl-r');
  setVis(r, true);
  r.innerHTML =
    '<div class="airesp">'
    +'<div class="aibadge"><span class="aibadge-glyph" aria-hidden="true">'+modGlyph('strategy')+'</span>'+escHtml(modName('strategy'))+'</div>'
    +COPY_BTN_HTML
    +'<div class="aitxt" id="strat-result-body"></div>'
    +'</div>'
    +'<div class="res-actions">'
    +(canAsk
      ? '<button class="btn bp bsm" id="strat-rfollowup">Задати питання'+(shortLeft!==null?' ('+shortLeft+')':'')+'</button>'
      : '<button class="btn bs bsm" id="strat-rfollowup" disabled>Уточнень не лишилось</button>'
    )
    +'<div class="bpair">'
    +'<button class="btn bg bsm" id="strat-rnew">Новий розбір</button>'
    +'<button class="btn bg bsm" id="strat-rhome">Головна</button>'
    +'</div>'
    +'</div>'
    +'<div class="res-saved">Збережено в профілі</div>';

  document.getElementById('strat-result-body').innerHTML = renderMarkdown(md);
  document.getElementById('strat-rnew').addEventListener('click', function(){ askNicheThenGo('strategy'); });
  document.getElementById('strat-rhome').addEventListener('click', function(){ show('home'); });
  var btnFu = document.getElementById('strat-rfollowup');
  if(btnFu && canAsk) btnFu.addEventListener('click', function(){
    openFollowup(stratId, 'strategy', md);
  });
}

/* Екран помилки генерації — спільний для всіх AI-модулів.

   mod — модуль, з якого прийшла помилка. Раніше параметра не було, і
   «Спробувати знову» завжди запускало stratGenResult: модуль «Знайти свою
   нішу» з порожньою анкетою стратегії. Людина з «Покращити мій блог» чи
   «Знайти теми для контенту» отримувала «Анкета порожня» замість свого
   розбору і ще й втрачала на цьому слот (жовтень 2026, скарги з чату).
   Тепер повтор іде тим самим модулем і з тими самими відповідями.

   data.code === 'empty_answers' — сервер не отримав жодної відповіді (і
   слот не списав). Повторювати той самий запит марно: ведемо в анкету. */
var GEN_BY_MOD = {
  strategy: function(){ stratGenResult(); },
  content:  function(){ contGenResult(); },
  blog:     function(){ blogGenResult(); },
  warmups:  function(){ warmGenResult(); },
  mentor:   function(){ mntGenResult(); }
};
function stratShowError(mod, data){
  if(!GEN_BY_MOD[mod]) mod = 'strategy';
  var empty = !!(data && data.code === 'empty_answers');
  document.getElementById('fl-q').innerHTML =
    '<div class="qcard qcard-msg">'
    +'<div class="qtxt">'+(empty ? 'Відповіді анкети не дійшли' : 'Не вдалось отримати розбір')+'</div>'
    +'<div class="qsub">'+(empty ? 'Розбір не списано — пройди анкету ще раз' : 'Перевір підключення і спробуй ще раз')+'</div>'
    +'<div class="res-actions">'
    +'<button class="btn bp bsm" id="strat-err-retry">'+(empty ? 'Пройти анкету знову' : 'Спробувати знову')+'</button>'
    +'<button class="btn bg bsm" id="strat-err-home">Головна</button>'
    +'</div></div>';
  document.getElementById('strat-err-retry').addEventListener('click', function(){
    if(empty) goMod(mod); else GEN_BY_MOD[mod]();
  });
  document.getElementById('strat-err-home').addEventListener('click', function(){ show('home'); });
}

/* ─────────────────────────────────────────────────────────────────────────────
   ВІДМОВИ СЕРВЕРА

   Гілку обирає data.code (константи ERR_* у webapp/api.py), а не текст помилки.
   Раніше тут стояло data.error.indexOf('Ліміт') >= 0, через що:
     — будь-яка правка копірайту на бекенді тихо ламала показ пейволу;
     — 402 «демо вичерпано» слова «Ліміт» не містив узагалі, тож замість
       екрана вибору тарифу користувач бачив «Не вдалось отримати розбір»
       і не мав звідки заплатити.
   ───────────────────────────────────────────────────────────────────────────── */
var REFUSALS = {
  module_locked: { title:'Модуль недоступний',
                   sub:'Цей розбір відкривається разом із доступом.',
                   reason:'locked_module' },
  demo_expired:  { title:'Демо-розбір використано',
                   sub:'Обери період доступу, щоб робити нові розбори.',
                   reason:'demo_used' },
  limit_reached: { title:'Ліміт розборів вичерпано',
                   sub:'Продовж доступ, щоб робити нові розбори.',
                   reason:'limit_reached' }
};

/* Відповідь без code — старий бекенд або закешована сторінка. Впізнаємо
   як раніше, щоб оновлення фронту й бекенду не мусили збігтися в часі. */
function refusalCode(data){
  if(!data) return null;
  if(data.code && REFUSALS[data.code]) return data.code;
  if(data.demo_expired)  return 'demo_expired';
  if(data.module_locked) return 'module_locked';
  if(data.error && String(data.error).indexOf('Ліміт') >= 0) return 'limit_reached';
  return null;
}

/* true — відмову показано; false — це не відмова, далі йде загальний обробник. */
function stratShowRefusal(data){
  var code = refusalCode(data);
  if(!code) return false;
  var card = REFUSALS[code];

  /* Лічильник «5/5» сервер віддає в дужках усередині тексту — це єдине, що
     беремо звідти дослівно. Решту копії тримаємо тут, поруч з рештою UI. */
  var counter = (String(data.error || '').match(/\((\d+\s*\/\s*\d+)\)/) || [])[1];
  var sub = (code === 'limit_reached' && counter)
    ? 'Використано ' + counter + ' розборів у твоєму тарифі.'
    : card.sub;

  document.getElementById('fl-q').innerHTML =
    '<div class="qcard qcard-msg">'
    +'<div class="qcard-lock" aria-hidden="true">'+LOCK_SVG+'</div>'
    +'<div class="qtxt">'+escHtml(card.title)+'</div>'
    +'<div class="qsub">'+escHtml(sub)+'</div>'
    +'<div class="res-actions">'
    +'<button class="btn bp bsm" id="strat-lim-buy">Отримати доступ</button>'
    +'<button class="btn bg bsm" id="strat-lim-home">Головна</button>'
    +'</div></div>';
  document.getElementById('strat-lim-buy').addEventListener('click', function(){ requestAccess(card.reason); });
  document.getElementById('strat-lim-home').addEventListener('click', function(){ show('home'); });
  return true;
}

/* ─────────────────────────────────────────────────────────────────────────────
   MARKDOWN RENDERER
   Підтримує: **bold**, *italic*, # ## ### заголовки, - списки, нумеровані списки,
   горизонтальні лінії (---), порожні рядки між абзацами.
   ───────────────────────────────────────────────────────────────────────────── */
function renderMarkdown(text){
  if(!text) return '';

  /* Екранування HTML.
     Локальна змінна навмисно НЕ називається t: у файлі є глобальна t() для
     локалізації, і затінення її всередині великої функції — готова пастка. */
  var escaped = text
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');

  var lines  = escaped.split('\n');
  var html   = '';
  var inList  = false;
  var inOList = false;
  var inPara  = false;
  var inTable = false;
  var tableHeaders = [];

  function closeLists(){
    if(inList)  { html += '</ul>'; inList  = false; }
    if(inOList) { html += '</ol>'; inOList = false; }
  }
  function closePara(){
    if(inPara){ html += '</p>'; inPara = false; }
  }
  function closeTable(){
    if(inTable){ html += '</tbody></table>'; inTable = false; tableHeaders = []; }
  }

  lines.forEach(function(raw){
    var line = raw.trimEnd();

    /* Горизонтальна лінія */
    if(/^---+$/.test(line.trim()) && !inTable){
      closeLists(); closePara(); closeTable();
      html += '<hr class="md-hr">';
      return;
    }

    /* Таблиця: рядки з | */
    if(/^\|.+\|$/.test(line.trim())){
      var cells = line.trim().replace(/^\||\|$/g,'').split('|').map(function(c){ return c.trim(); });

      /* Рядок роздільника: |---|---| */
      if(cells.every(function(c){ return /^:?-+:?$/.test(c); })){
        return; /* пропускаємо — заголовки вже рендеримо при першому рядку */
      }

      closeLists(); closePara();

      if(!inTable){
        /* Перший рядок → заголовки */
        inTable = true;
        tableHeaders = cells;
        html += '<table class="md-table"><thead><tr>';
        cells.forEach(function(c){ html += '<th>'+inlineFormat(c)+'</th>'; });
        html += '</tr></thead><tbody>';
      } else {
        html += '<tr>';
        cells.forEach(function(c){ html += '<td>'+inlineFormat(c)+'</td>'; });
        html += '</tr>';
      }
      return;
    } else {
      closeTable();
    }

    /* Заголовки # ## ### */
    var hm = line.match(/^(#{1,3})\s+(.+)$/);
    if(hm){
      closeLists(); closePara();
      var lvl = hm[1].length;
      var cls = lvl === 1 ? 'md-h1' : lvl === 2 ? 'md-h2' : 'md-h3';
      html += '<div class="'+cls+'">'+inlineFormat(hm[2])+'</div>';
      return;
    }

    /* Маркований список */
    var ulm = line.match(/^[\-\*•]\s+(.+)$/);
    if(ulm){
      closePara();
      if(inOList){ html += '</ol>'; inOList = false; }
      if(!inList){ html += '<ul class="md-ul">'; inList = true; }
      html += '<li>'+inlineFormat(ulm[1])+'</li>';
      return;
    }

    /* Нумерований список */
    var olm = line.match(/^(\d+)\.\s+(.+)$/);
    if(olm){
      closePara();
      if(inList){ html += '</ul>'; inList = false; }
      if(!inOList){ html += '<ol class="md-ol">'; inOList = true; }
      html += '<li>'+inlineFormat(olm[2])+'</li>';
      return;
    }

    /* Порожній рядок */
    if(line.trim() === ''){
      closeLists(); closePara(); closeTable();
      return;
    }

    /* Звичайний рядок — абзац */
    closeLists();
    if(!inPara){ html += '<p>'; inPara = true; }
    else { html += '<br>'; }
    html += inlineFormat(line);
  });

  closeLists(); closePara(); closeTable();
  return html;
}

function inlineFormat(s){
  return s
    /* **bold** */
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    /* *italic* або _italic_ */
    .replace(/\*([^\*\n]+?)\*/g,'<em>$1</em>')
    .replace(/_([^_\n]+?)_/g,'<em>$1</em>')
    /* `code` */
    .replace(/`([^`\n]+?)`/g,'<code class="md-code">$1</code>')
    /* [text](url) */
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,'<a href="$2" target="_blank" rel="noopener" class="md-link">$1</a>')
    /* голе посилання https://... */
    .replace(/(^|[\s\(])(https?:\/\/[^\s\)]+)/g,'$1<a href="$2" target="_blank" rel="noopener" class="md-link">$2</a>');
}

/* ═══════════════════════════════════════════════════
   ДИСПЕТЧЕР МОДУЛІВ
   Кожен модуль має власний повний флоу (askNicheThenGo).
   Легасі-флоу MODS з фейковими питаннями і демо-результатами видалено.
   ═══════════════════════════════════════════════════ */

function goMod(id){
  if(MODULES[id]){ askNicheThenGo(id); return; }
  showToast('Модуль поки недоступний');
}

/* ═══════════════════════════════════════════════════
   МОЇ СТРАТЕГІЇ
   ═══════════════════════════════════════════════════ */

/* Підписи модулів беруться з реєстру MODULES — окремих таблиць більше немає. */
function openMyStrategies(module){
  /* Запам'ятовуємо, звідки відкрили: кнопка «Отримати розбір» на порожньому
     списку веде в цей самий модуль, а зі списку всіх розборів — на головну. */
  S._myStratModule = (module && typeof module === 'string') ? module : null;
  var titleEl = document.getElementById('my-strategies-title');
  if(titleEl) titleEl.textContent = module ? getHistoryLabel(module) : 'Мої розбори';
  pushScreen('my-strategies');
  loadStrategiesList(module);
}

function loadStrategiesList(filterModule){
  var wrap    = document.getElementById('strategies-list');
  var loading = document.getElementById('strat-loading');
  var empty   = document.getElementById('strategies-empty');
  wrap.innerHTML = '';
  setVis(loading, true);
  setVis(empty, false);

  fetch(apiUrl('/api/strategies' + (filterModule && typeof filterModule === 'string' ? '?module=' + filterModule : '')))
    .then(function(r){ return r.json(); })
    .then(function(data){
      setVis(loading, false);
      if(!data.ok || !data.items || !data.items.length){
        setVis(empty, true);
        return;
      }
      data.items.forEach(function(item){
        var card = document.createElement('div');
        card.className = 'strat-card';
        card.innerHTML =
          '<div class="strat-card-label"><span class="strat-card-glyph" aria-hidden="true">'+modGlyph(item.module)+'</span>'+escHtml(modName(item.module))+'</div>'
          +'<div class="strat-card-niche">'+escHtml(item.preview || item.niche)+'</div>'
          +'<div class="strat-card-date">'+escHtml(item.created_at)+'</div>';
        card.addEventListener('click', function(){ openStrategyDetail(item.id, item.module, item.created_at); });
        wrap.appendChild(card);
      });
    })
    .catch(function(){ setVis(loading, false); showToast('Помилка завантаження'); });
}

function openStrategyDetail(id, module, date){
  document.getElementById('strategy-detail-title').textContent = modGlyph(module) + '  ' + modName(module);
  document.getElementById('strategy-detail-meta').textContent  = date;
  document.getElementById('strategy-detail-body').innerHTML    = LOADING_HTML;

  /* Кнопка "Задати питання" вгорі */
  var sdActions = document.getElementById('sd-actions');
  var sdBtn     = document.getElementById('sd-followup-btn');
  if(sdActions && sdBtn){
    /* Ліміти живуть у S.subscription, а не в S.usage: S.usage має лише
       *_used і *_left (див. ініціалізацію S). Тут раніше читалось
       S.usage.short_limit — ключа, якого не існує, — тож умова
       `!== undefined` була завжди хибною, sl завжди ставав null, і кнопка
       на будь-якому тарифі виглядала безлімітною: без лічильника і активною
       навіть коли уточнення скінчились. Реальну відправку рятував лише
       guard у sendFollowup. */
    var sl        = quotaLimit(S.subscription.short_limit, 3);
    var su        = (S.usage && S.usage.short_used)  ? S.usage.short_used : 0;
    var shortLeft = (sl === null) ? null : Math.max(0, sl - su);
    var canAsk    = (shortLeft === null || shortLeft > 0);
    var label     = t('btn_ask_question','Задати питання') + (shortLeft !== null && shortLeft !== undefined ? ' (' + shortLeft + ')' : '');
    sdBtn.textContent = label;
    setVis(sdActions, true);
    /* Перевиставляємо обробник щоб не дублювався */
    var newBtn = sdBtn.cloneNode(true);
    newBtn.textContent = label;
    if(!canAsk){
      newBtn.disabled = true;
      newBtn.className = 'btn bs bsm';
      newBtn.textContent = t('fu_none_left','Уточнень не лишилось');
    }
    sdBtn.parentNode.replaceChild(newBtn, sdBtn);
    newBtn.addEventListener('click', function(){
      openFollowup(id, module, null);
    });
  }

  show('strategy-detail');

  fetch(apiUrl('/api/strategies/'+id))
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(!data.ok || !data.result){
        document.getElementById('strategy-detail-body').textContent = t('err_loading','Помилка завантаження');
        return;
      }
      document.getElementById('strategy-detail-body').innerHTML = renderMarkdown(data.result);
    })
    .catch(function(){
      document.getElementById('strategy-detail-body').textContent = t('err_loading','Помилка завантаження');
    });
}

function escHtml(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function showToast(msg, isError){
  var el=document.getElementById('toast-el');
  el.textContent=msg;
  el.classList.toggle('err', !!isError);
  el.classList.add('show');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(function(){ el.classList.remove('show','err'); }, isError ? 4000 : 3000);
}
function showErrToast(msg){ showToast(msg, true); }


/* ═══════════════════════════════════════════════════
   FOLLOWUP — короткі уточнення після стратегії
   ═══════════════════════════════════════════════════ */

var fu = { strategyId:null, module:'strategy', strategyMd:'', history:[] };

function openFollowup(stratId, module, md){
  fu.strategyId = stratId;
  fu.module     = module || 'strategy';
  fu.strategyMd = md || '';
  fu.history    = [];

  var titleEl = document.getElementById('followup-title');
  if(titleEl) titleEl.textContent = module ? ('Уточнення — ' + modName(module)) : 'Уточнення';

  var prevBody = document.getElementById('followup-strategy-body');
  if(prevBody) prevBody.innerHTML = renderMarkdown(fu.strategyMd.slice(0,400)+(fu.strategyMd.length>400?'…':''));

  var chat = document.getElementById('followup-chat');
  if(chat) chat.innerHTML = '';

  updateFollowupLimit();

  var sl = S.subscription.short_limit;
  var su = S.usage.short_used || 0;
  var shortLeft = (sl===null) ? null : Math.max(0, sl-su);
  var limitReached = shortLeft!==null && shortLeft<=0;
  var inputWrap = document.getElementById('followup-input-wrap');
  var limitDiv  = document.getElementById('followup-limit-reached');
  if(inputWrap) setVis(inputWrap, !(limitReached));
  if(limitDiv)  setVis(limitDiv, limitReached);

  var inp = document.getElementById('followup-input');
  if(inp) inp.value = '';
  show('followup');
}

function openStrategyDetailWithFollowup(id, module, date){
  /* Використовуємо оновлений openStrategyDetail який вже показує кнопку вгорі */
  openStrategyDetail(id, module, date);
}

function updateFollowupLimit(){
  var sl = S.subscription.short_limit;
  var su = S.usage.short_used || 0;
  var el = document.getElementById('followup-limit-val');
  if(el){
    el.textContent = su+' / '+(sl===null?'∞':sl);
    if(sl!==null&&(sl-su)<=1) el.style.color='var(--redl)';
  }
}

function sendFollowup(){
  var inp = document.getElementById('followup-input');
  var question = inp ? inp.value.trim() : '';
  if(!question){ showToast(t('fu_empty','Введи питання')); return; }
  /* Ховаємо клавіатуру */
  if(inp) inp.blur();
  if(!fu.strategyId){ showToast(t('fu_no_strategy','Помилка: стратегія не знайдена')); return; }

  var sl = S.subscription.short_limit;
  var su = S.usage.short_used || 0;
  var shortLeft = (sl===null) ? null : Math.max(0,sl-su);
  if(shortLeft!==null && shortLeft<=0){ showLimitReachedFu(); return; }

  appendFuMsg('user', question);
  if(inp) inp.value='';

  var loadDiv = document.getElementById('followup-loading');
  var sendBtn = document.getElementById('followup-send');
  var inputEl = document.getElementById('followup-input');
  if(loadDiv) setVis(loadDiv, true);
  if(sendBtn) sendBtn.disabled=true;
  if(inputEl) inputEl.disabled=true;

  fetch(apiUrl('/api/followup'), {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ strategy_id:fu.strategyId, question:question, history:fu.history })
  })
  .then(function(r){ return r.json(); })
  .then(function(data){
    if(loadDiv) setVis(loadDiv, false);
    if(sendBtn) sendBtn.disabled=false;
    if(inputEl) inputEl.disabled=false;
    if(!data.ok){
      if(data.code === 'short_limit_reached'
         || (!data.code && data.error && String(data.error).indexOf('Ліміт')>=0)) showLimitReachedFu();
      else showToast(serverErrText(data));
      return;
    }
    appendFuMsg('assistant', data.answer);
    fu.history.push({role:'user',content:question});
    fu.history.push({role:'assistant',content:data.answer});
    if(data.usage){
      S.usage.short_used  = data.usage.short_used  || 0;
      S.usage.short_left  = data.usage.short_left  !== undefined ? data.usage.short_left  : null;
      S.subscription.short_limit = data.usage.short_limit !== undefined ? data.usage.short_limit : S.subscription.short_limit;
    }
    updateFollowupLimit();
    animBars();
    var slN=S.subscription.short_limit, suN=S.usage.short_used||0;
    if(slN!==null && Math.max(0,slN-suN)<=0) showLimitReachedFu();
  })
  .catch(function(err){
    console.error('[sendFollowup]',err);
    if(loadDiv) setVis(loadDiv, false);
    if(sendBtn) sendBtn.disabled=false;
    if(inputEl) inputEl.disabled=false;
    showToast(t('err_network','Помилка мережі.'));
  });
}

function appendFuMsg(role, text){
  var chat = document.getElementById('followup-chat'); if(!chat) return;
  var wrap = document.createElement('div'); wrap.className='fu-msg';
  if(role==='user'){
    wrap.innerHTML='<div class="fu-msg-q">'+escHtml(text)+'</div>';
  } else {
    wrap.innerHTML='<div class="fu-msg-badge">Наставник</div><div class="fu-msg-a">'+renderMarkdown(text)+'</div>';
  }
  chat.appendChild(wrap);
  wrap.scrollIntoView({behavior:'smooth',block:'end'});
}

function showLimitReachedFu(){
  var inputWrap=document.getElementById('followup-input-wrap');
  var limitDiv=document.getElementById('followup-limit-reached');
  if(inputWrap) setVis(inputWrap, false);
  if(limitDiv)  setVis(limitDiv, true);
}



/* ═══════════════════════════════════════════════════
   НІША — зберігання і редагування з кабінету
   ═══════════════════════════════════════════════════ */

var NICHE_OPTIONS = ['Нумерологія','Психологія','Коучинг','Фітнес / здоров\'я','Б\'юті','Маркетинг / блогінг','Бізнес / підприємництво','Навчання професії','Інша ніша'];

/* ═══════════════════════════════════════════════════
   НІША — картка в профілі + модалка вибору
   ═══════════════════════════════════════════════════ */

function renderNicheBlock(){
  var block = document.getElementById('prof-niche-block');
  if(!block) return;
  var current = S.profile.niche;

  var label = current || t('niche_empty', 'Не вказано');

  block.innerHTML =
    '<button class="niche-row" id="niche-open-btn">'+
      '<div class="niche-row-left">'+
        '<div class="niche-row-ico" aria-hidden="true">'+NICHE_GLYPH+'</div>'+
        '<div class="niche-row-info">'+
          '<div class="niche-row-title">'+escHtml(t('niche_title','Твоя ніша'))+'</div>'+
          '<div class="niche-row-val'+(current ? '' : ' empty')+'">'+escHtml(label)+'</div>'+
        '</div>'+
      '</div>'+
      '<div class="niche-row-arrow">'+
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'+
      '</div>'+
    '</button>';

  document.getElementById('niche-open-btn').addEventListener('click', openNicheModal);
}

/* Раніше тут був набір із дев'яти кольорових емодзі — друга система
   іконок поруч із монохромними гліфами модулів. Ніша і так підписана
   текстом, тому іконка тут чисто декоративна — один гліф на всі. */
var NICHE_GLYPH = '◇';


/* ═══════════════════════════════════════════════════
   МОВА — картка в профілі + модалка вибору

   Той самий патерн, що й ніша: рядок у кабінеті → шит зі списком → запис на
   сервер. Різниця одна: мова застосовується оптимістично, ще до відповіді
   сервера, і відкочується, якщо запит не пройшов. Інакше при поганому звʼязку
   користувач тицяв би в перемикач, не бачачи жодної реакції.
   ═══════════════════════════════════════════════════ */

var LANG_GLYPH = '◆';

function renderLangBlock(){
  var block = document.getElementById('prof-lang-block');
  if(!block) return;

  block.innerHTML =
    '<button class="niche-row" id="lang-open-btn">'+
      '<div class="niche-row-left">'+
        '<div class="niche-row-ico" aria-hidden="true">'+LANG_GLYPH+'</div>'+
        '<div class="niche-row-info">'+
          '<div class="niche-row-title">'+escHtml(t('lang_row_title','Мова'))+'</div>'+
          '<div class="niche-row-val lang-val">'+langLabelHtml(LANG)+'</div>'+
        '</div>'+
      '</div>'+
      '<div class="niche-row-arrow">'+
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'+
      '</div>'+
    '</button>';

  document.getElementById('lang-open-btn').addEventListener('click', openLangModal);
}

function openLangModal(){
  var list = document.getElementById('lm-list');
  if(!list) return;

  list.innerHTML = Object.keys(LANG_LABELS).map(function(code){
    return '<div class="nm-item'+(code === LANG ? ' sel' : '')+'" data-lang="'+escHtml(code)+'">'+
             '<div class="nm-item-left lang-val">'+langLabelHtml(code)+'</div>'+
             '<div class="nm-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>'+
           '</div>';
  }).join('');

  list.querySelectorAll('.nm-item').forEach(function(item){
    item.addEventListener('click', function(){ selectLang(item.dataset.lang); });
  });

  document.getElementById('lang-modal').classList.add('open');
}

function closeLangModal(){
  var m = document.getElementById('lang-modal');
  if(m) m.classList.remove('open');
}

function selectLang(code){
  closeLangModal();
  if(!code || code === LANG) return;

  var previous = LANG;

  /* Оптимістично: перемальовуємо одразу, без перезавантаження сторінки —
     reload у Telegram WebApp скидає стан і повертає користувача на сплеш. */
  LANG = code;
  S.profile.lang = code;
  applyLangEverywhere();

  apiFetch('/api/profile/lang', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lang: code })
  }).then(function(data){
    if(data && data.ok){
      showToast(t('lang_saved', 'Мову змінено'));
      return;
    }
    /* Сервер відмовив (напр. code === 'unsupported_lang' — кнопка зі старої
       версії). Відкочуємо: інакше інтерфейс показував би мову, якої немає в
       БД, і бот говорив би іншою.
       Відкат ПЕРЕД текстом помилки — інакше тост писався б мовою, яку сервер
       щойно не прийняв, тобто саме тією, якої користувач уже не бачить. */
    revert();
    showErrToast(serverErrText(data, 'lang_save_failed'));
  }).catch(function(err){
    console.error('[lang]', err);
    revert();
    showErrToast(t('lang_save_failed', 'Не вдалося змінити мову. Спробуй ще раз.'));
  });

  function revert(){
    LANG = previous;
    S.profile.lang = previous;
    applyLangEverywhere();
  }
}

/* ── Модалка вибору ніші ───────────────────────────────────────────── */

var _nicheSelected = null;   // вибране в модалці (до збереження)

function openNicheModal(){
  _nicheSelected = S.profile.niche;
  var isOther = _nicheSelected && NICHE_OPTIONS.indexOf(_nicheSelected) < 0;

  var items = '';
  NICHE_OPTIONS.forEach(function(opt){
    var isOth = opt.toLowerCase().indexOf('інш') >= 0;
    var selThis = (opt === _nicheSelected) || (isOther && isOth);
    items +=
      '<div class="nm-item'+(selThis?' sel':'')+'" data-val="'+escHtml(opt)+'">'+
        '<div class="nm-item-left">'+
          '<span class="nm-item-name">'+escHtml(opt)+'</span>'+
        '</div>'+
        '<div class="nm-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>'+
      '</div>';
  });

  var customVal = isOther ? escHtml(_nicheSelected) : '';

  document.getElementById('nm-list').innerHTML = items;
  setVis('nm-custom-row', isOther);
  document.getElementById('nm-custom-inp').value = customVal;
  document.getElementById('niche-modal').classList.add('open');

  // Біндимо кліки на айтеми
  document.querySelectorAll('.nm-item').forEach(function(item){
    item.addEventListener('click', function(){
      document.querySelectorAll('.nm-item').forEach(function(i){ i.classList.remove('sel'); });
      item.classList.add('sel');
      _nicheSelected = item.dataset.val;
      var customRow = document.getElementById('nm-custom-row');
      if(_nicheSelected.toLowerCase().indexOf('інш') >= 0){
        setVis(customRow, true);
        document.getElementById('nm-custom-inp').focus();
        _nicheSelected = null;
      } else {
        setVis(customRow, false);
      }
    });
  });
}

function closeNicheModal(){
  document.getElementById('niche-modal').classList.remove('open');
}

function confirmNicheModal(){
  var selItem = document.querySelector('.nm-item.sel');
  if(!selItem){ showToast('Обери нішу'); return; }

  var val;
  if(selItem.dataset.val.toLowerCase().indexOf('інш') >= 0){
    val = document.getElementById('nm-custom-inp').value.trim();
    if(!val){ showToast(t('niche_custom_required','Напиши свою нішу')); return; }
  } else {
    val = selItem.dataset.val;
  }
  saveNiche(val);
}

function saveNiche(niche){
  var btn = document.getElementById('nm-save-btn');
  if(btn){ btn.disabled = true; btn.textContent = t('niche_saving','Зберігаємо...'); }

  apiFetch('/api/profile/niche', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ niche: niche })
  }).then(function(data){
    if(btn){ btn.disabled = false; btn.textContent = t('niche_save_btn','Зберегти →'); }
    if(!data.ok){ showErrToast(serverErrText(data,'err_save_failed','Помилка збереження')); return; }
    S.profile.niche = niche;
    closeNicheModal();
    renderNicheBlock();
    showToast(t('niche_saved','Нішу збережено: ') + niche);
  }).catch(function(){
    if(btn){ btn.disabled = false; btn.textContent = t('niche_save_btn','Зберегти →'); }
    showErrToast(t('err_network','Помилка мережі'));
  });
}


/* ═══════════════════════════════════════════════════
   GUARD — захист навбару і тарифів для незареєстрованих
   ═══════════════════════════════════════════════════ */

function guardedNav(screenId){
  /* Для незареєстрованих — дозволяємо тільки тарифи */
  if(S.registered) return true;
  if(screenId === 'tar') return true;
  return false;
}

function tryShowScreen(screenId){
  if(guardedNav(screenId)){
    show(screenId);
  } else {
    /* Мовчки ігноруємо — незареєстрований не може піти на home/prof/aut */
  }
}


/* ═══════════════════════════════════════════════════
   ВИБІР НІШІ ПЕРЕД МОДУЛЕМ (якщо ще не збережена)
   ═══════════════════════════════════════════════════ */

function askNicheThenGo(moduleId){
  /* Модулі з noNiche (нумерологія) працюють від дати народження, а не від
     ніші. Питати нішу перед матрицею — зайвий крок, який до того ж зберіг би
     нішу «про всяк випадок» у профіль, хоча користувач її не для цього ввів. */
  if(MODULES[moduleId] && MODULES[moduleId].noNiche){
    _launchModule(moduleId);
    return;
  }

  /* Якщо ніша вже збережена — одразу в модуль */
  if(S.profile.niche){
    _launchModule(moduleId);
    return;
  }

  /* Показуємо mflow з вибором ніші */
  document.getElementById('fl-title').textContent = modName(moduleId) || moduleId;
  document.getElementById('fl-prog').innerHTML = '';
  setVis('fl-r', false);
  setVis('fl-q', true);
  show('mflow');

  _renderNicheAskStep(moduleId);
}

function _renderNicheAskStep(moduleId){
  var container = document.getElementById('fl-q');
  container.innerHTML = '';

  var wrap = document.createElement('div');
  wrap.className = 'qcard';

  /* Заголовок */
  var num = document.createElement('div');
  num.className = 'qnum';
  num.textContent = 'Крок 1 з 1';
  wrap.appendChild(num);

  var txt = document.createElement('div');
  txt.className = 'qtxt';
  txt.textContent = 'У якій ніші ти працюєш?';
  wrap.appendChild(txt);

  var sub = document.createElement('div');
  sub.className = 'qsub';
  sub.textContent = 'Збережемо, щоб не питати кожного разу';
  wrap.appendChild(sub);

  /* Чіпи */
  var grid = document.createElement('div');
  grid.className = 'chips';
  var selectedNiche = null;

  NICHE_OPTIONS.forEach(function(opt){
    var chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = opt;
    var isOther = opt.toLowerCase().indexOf('інш') >= 0;

    chip.addEventListener('click', function(){
      grid.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('sel'); });
      chip.classList.add('sel');
      selectedNiche = opt;
      if(isOther){
        setVis(customRow, true);
        customInp.focus();
      } else {
        setVis(customRow, false);
        /* Авто-перехід через 280мс для не-"Інша" */
        setTimeout(function(){ _saveNicheAndLaunch(opt, moduleId); }, 280);
      }
    });
    grid.appendChild(chip);
  });
  wrap.appendChild(grid);

  /* Поле для "Інша ніша" */
  var customRow = document.createElement('div');
  setVis(customRow, false);
  customRow.style.marginTop = '10px';
  var customInp = document.createElement('input');
  customInp.className = 'inp';
  customInp.type = 'text';
  customInp.placeholder = 'Напиши свою нішу...';
  customRow.appendChild(customInp);
  wrap.appendChild(customRow);

  container.appendChild(wrap);

  /* Кнопка "Далі" (видна тільки для "Інша") */
  var btnRow = document.createElement('div');
  btnRow.className = 'bpair';
  btnRow.style.marginTop = '16px';
  setVis(btnRow, false);  /* показуємо тільки для "Інша" */

  var btnNext = document.createElement('button');
  btnNext.className = 'btn bp';
  btnNext.style.flex = '2';
  btnNext.textContent = 'Далі';
  btnNext.addEventListener('click', function(){
    var selChip = grid.querySelector('.chip.sel');
    if(!selChip){ showToast('Обери нішу'); return; }
    var val;
    if(selChip.textContent.toLowerCase().indexOf('інш') >= 0){
      val = customInp.value.trim();
      if(!val){ showToast(t('niche_custom_required','Напиши свою нішу')); return; }
    } else {
      val = selChip.textContent;
    }
    _saveNicheAndLaunch(val, moduleId);
  });
  btnRow.appendChild(btnNext);
  container.appendChild(btnRow);

  /* Показуємо кнопку "Далі" коли обрано "Інша" */
  grid.querySelectorAll('.chip').forEach(function(chip){
    chip.addEventListener('click', function(){
      var isOth = chip.textContent.toLowerCase().indexOf('інш') >= 0;
      setVis(btnRow, isOth);
    });
  });
}

function _saveNicheAndLaunch(niche, moduleId){
  /* Зберігаємо локально одразу щоб не чекати API */
  S.profile.niche = niche;

  /* Показуємо лоадер */
  var container = document.getElementById('fl-q');
  container.innerHTML = '<div class="loading tc">'
    + '<div class="typing"><span></span><span></span><span></span></div>'
    + '<div class="loading-cap">Зберігаємо нішу…</div>'
    + '</div>';

  apiFetch('/api/profile/niche', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ niche: niche })
  }).then(function(data){
    if(data && data.ok){
      renderNicheBlock(); /* оновити кабінет */
    }
    /* Запускаємо модуль навіть якщо API повернув помилку — ніша вже в стані */
    _launchModule(moduleId);
  }).catch(function(){
    _launchModule(moduleId);
  });
}


function _launchModule(moduleId){
  if(moduleId === 'strategy'){ goStrategyMod(); }
  else if(moduleId === 'warmups'){  goWarmupsMod();  }
  else if(moduleId === 'content'){  goContentMod();  }
  else if(moduleId === 'blog'){     goBlogMod();     }
  else if(moduleId === 'mentor'){   goMentorMod();   }
  else if(moduleId === 'numerology'){ numOpen();     }
}



/* ═══════════════════════════════════════════════════
   НУМЕРОЛОГІЯ · МАТРИЦЯ ДОЛІ

   Фронт нічого не рахує. Уся арифметика живе в numerology/core.py,
   сюди приходить готова матриця і лише розкладається по екранах. Це не
   стилістична забаганка: варто продублювати хоч одне R(n) у JS — і два
   калькулятори почнуть розходитись на граничних значеннях (22 лишається
   22), а помітить це користувач, а не тест.
   ═══════════════════════════════════════════════════ */

var NUM = {
  /* active — те, що зараз намальовано на схемі. Персональна матриця і
     матриця пари мають ОДНАКОВУ форму (compatibility_matrix повертає той
     самий словник), тому всі рендери працюють з обома без розгалужень. */
  active:  null,
  mode:    'self',          // 'self' | 'pair'
  birthdate: null,
  partnerBirthdate: null,
  hints:   null,
  energyTitles: null,
  contentLang: null,
  showHints: false,
  /* Масштаб повноекранного перегляду (numZoomOpen): ширина схеми в
     ширинах екрана. 0 — перегляд закритий. */
  zoom: 0,
  /* Тлумачення вантажаться ліниво (по одному запиту на енергію) і кешуються
     на час сесії: JSON усіх 22 енергій важить ~120 КБ, а користувач читає
     дві-три. Кеш живе до перезавантаження WebApp. */
  energyCache: {},
  tailCache:   {},
  /* Зональні тлумачення: { '<blockId>': { '<енергія>': {title, paras, fallback} } }.
     Кешуються так само й з тієї ж причини, що енергії: повний каталог — це 17
     блоків × 22 енергії, а людина за сесію відкриє два-три блоки. */
  blockCache:  {},
  /* Застереження методички на блок: { '<blockId>': '<текст>' }. Приходить
     тією ж ручкою, що й тексти, і саме текстом, а не прапорцем — щоб
     правка формулювання замовницею доїжджала без релізу фронта. */
  blockNote:   {},
  /* Який блок зараз показує #num-block. Потрібне саме окремим полем: відповідь
     на запит тлумачень приходить асинхронно, і без цієї перевірки текст блоку,
     відкритого й закритого раніше, домалювався б поверх наступного. */
  blockId:     null
};

/* Позиції, чиє коло на схемі назавжди показує літеру, а не число.
   Л і М геометрично збігаються з V1 і G1 (numerology/registry.py): число
   малюється один раз у великому кружку, а бейдж лишається літерою, щоб
   поруч не стояли два однакових числа, ніби це різні значення. */
var NUM_BADGE_PTS = { L:1, M:1 };

/* Підписи позицій українськими літерами — рівно ті, що на авторській схемі
   й у content/uk/zones.json («А • Б • ЗК», «К → О → Л»). Без цієї мапи
   підказка зони посилалась би на «Л», а шторка показувала б «V1». */
var NUM_LABELS = {
  A:'А', B:'Б', V:'В', G:'Г', D:'Д', E:'Е', Zh:'Ж', Z:'З',
  C:'ЗК', CE:'ЗК-Е',
  L:'Л', M:'М', K:'К', O:'О', N:'Н'
};
function numPointLabel(pid){ return NUM_LABELS[pid] || pid; }

/* Юзернейм консультантки. Винесений у константу навмисно: він змінюється
   раніше, ніж будь-що навколо нього, а зашитий у рядок посилання шукався б
   грепом по всьому файлу. Публічний юзернейм — обов'язкова умова: параметр
   ?text= працює лише для них (core.telegram.org/api/links). */
var NUM_CONSULT_USER = 'Alina_Gricaenko';

/* ─── РЕЄСТР БЛОКІВ МАТРИЦІ ────────────────────────────────────────────────

   ЄДИНЕ місце, де перелічені розділи результату. Ні сітка на схемі, ні
   сторінка блоку не мають власного списку: два списки розходяться на першій
   же правці, і розійдуться мовчки — блок просто зникне з одного з екранів.

   Тут стояли NUM_TABS — п'ять вкладок, між якими були розкидані блоки. Через
   них єдиного переліку розділів не існувало взагалі: щоб побачити всі, треба
   було відкрити кожну вкладку.

   Кожен блок описує СЕБЕ:
     id     — стабільний ідентифікатор; він же ключ у content/uk/blocks.json
              і в підказках content/uk/zones.json, тому перейменування id
              мовчки відв'язує блок від його текстів;
     key/uk — назва в інтерфейсі (i18n-ключ + українське джерело);
     zone   — id зони з numerology/registry.py: числа беруться звідти;
     vals   — для блоків, яких немає серед зон (призначення, родові коди):
              функція, що дістає числа з матриці разом із підписами;
     aux    — допоміжні числа, які показуються тьмяніше за основні;
     screen — для пунктів, що ведуть на вже наявний екран, а не на сторінку
              блоку.

   Чого тут навмисно НЕМАЄ: skyLine і earthLine окремими блоками. Це проміжні
   числа призначення (sky = R(Б+Г), earth = R(А+В), personal = R(sky+earth)) —
   окремим розділом вони показують користувачу нашу арифметику, а не його
   матрицю. Тому вони живуть допоміжними числами ВСЕРЕДИНІ «Призначення». */
var NUM_BLOCKS = [
  { key:'num_cat_person', uk:'Особистість', blocks:[
    { id:'personality', key:'num_blk_personality', uk:'Архетип особистості',        zone:'personality' },
    { id:'comfort',     key:'num_blk_comfort',     uk:'Зона комфорту',              zone:'comfort' },
    { id:'talents',     key:'num_blk_talents',     uk:'Таланти',                    zone:'talents' },
    { id:'childParent', key:'num_blk_child_parent', uk:'Дитячо-батьківський сценарій', zone:'childParent' }
  ]},
  { key:'num_cat_money', uk:'Фінанси та реалізація', blocks:[
    { id:'finance',       key:'num_blk_finance',       uk:'Фінанси та матеріальна карма', zone:'finance' },
    { id:'moneyChannel',  key:'num_blk_money_channel', uk:'Фінансовий канал',             zone:'moneyChannel' },
    { id:'profession',    key:'num_blk_profession',    uk:'Професія',                     zone:'profession' },
    { id:'ancestryMale',  key:'num_blk_ancestry_male', uk:'Лінія реалізації',             zone:'ancestryMale' }
  ]},
  { key:'num_cat_relations', uk:'Стосунки', blocks:[
    { id:'ancestryFemale',  key:'num_blk_ancestry_female', uk:'Лінія стосунків',  zone:'ancestryFemale' },
    { id:'idealPartner',    key:'num_blk_ideal_partner',   uk:'Ідеальний партнер', zone:'idealPartner' },
    { id:'relationChannel', key:'num_blk_relation_channel', uk:'Канал стосунків',  zone:'relationChannel' }
  ]},
  { key:'num_cat_karma', uk:'Карма та призначення', blocks:[
    /* Кармічний хвіст — і зона (Г1·Г2·Г), і власний текст на трійку кодів.
       Тому в нього і числа зони, і окрема кнопка розбору: три незалежних
       тлумачення енергій цей сценарій не описують. */
    { id:'karmicTail', key:'num_karmic_title', uk:'Кармічний хвіст', zone:'karmicTail', karmic:true },
    { id:'purposes', key:'num_purposes', uk:'Призначення',
      vals:function(m){
        var p = m.purposes;
        return [
          { n:p.personal,     label:t('num_purpose_personal','Особисте') },
          { n:p.social,       label:t('num_purpose_social','Соціальне') },
          { n:p.spiritual,    label:t('num_purpose_spiritual','Духовне') },
          { n:p.planetary,    label:t('num_purpose_planetary','Планетарне') },
          { n:p.socialMale,   label:t('num_purpose_social_male','Соціальне · чоловіча лінія') },
          { n:p.socialFemale, label:t('num_purpose_social_female','Соціальне · жіноча лінія') }
        ];
      },
      aux:function(m){
        var p = m.purposes;
        return [
          { n:p.sky,   label:t('num_sky_line','Чакри Небо') },
          { n:p.earth, label:t('num_earth_line','Чакри Земля') }
        ];
      } },
    { id:'maleCode', key:'num_male_code', uk:'Трійний код чоловічого роду',
      vals:function(m){ return m.ancestry.maleCode.map(function(n){ return { n:n }; }); } },
    { id:'femaleCode', key:'num_female_code', uk:'Трійний код жіночого роду',
      vals:function(m){ return m.ancestry.femaleCode.map(function(n){ return { n:n }; }); } },
    { id:'ancestralPower', key:'num_ancestral_power', uk:'Родова сила',
      vals:function(m){ return [{ n:m.ancestry.power }]; } },
    { id:'innerPower', key:'num_inner_power', uk:'Код внутрішньої сили',
      vals:function(m){
        var a = m.ancestry;
        return [
          { n:a.innerMale,   label:t('num_inner_male','чоловіча') },
          { n:a.innerFemale, label:t('num_inner_female','жіноча') },
          { n:a.innerTotal,  label:t('num_inner_total','разом') }
        ];
      } }
  ]},
  /* Три наявні екрани. Вони теж мусять бути в реєстрі: після зникнення смуги
     вкладок це єдиний вхід до них, і пункт, забутий тут, робить цілий екран
     недосяжним. */
  { key:'num_cat_extra', uk:'Додатково', blocks:[
    { id:'health',    key:'num_health_title',   uk:'Карта здоров’я',      screen:'num-health' },
    { id:'prognosis', key:'num_prog_title',     uk:'Прогностика',         screen:'num-prognosis' },
    { id:'energies',  key:'num_energies_title', uk:'Значення Арканів',    screen:'num-energies' }
  ]}
];

/* Плаский перелік — для пошуку блоку за id і для перевірок. Рахується щоразу,
   а не кешується: реєстр статичний, а кеш став би другим списком. */
function numAllBlocks(){
  var out = [];
  NUM_BLOCKS.forEach(function(cat){
    cat.blocks.forEach(function(b){ out.push(b); });
  });
  return out;
}

function numBlockById(id){
  var found = null;
  numAllBlocks().forEach(function(b){ if(b.id === id) found = b; });
  return found;
}

/* Числа блоку з матриці. Для зон беремо їх із самої відповіді сервера, а не
   з мапи «блок → точки» в JS: склад зон визначає numerology/registry.py, і
   другий перелік тут розійшовся б із ним на першій правці складу зони. */
function numBlockValues(b, m){
  if(!b || !m || b.screen) return [];
  if(b.zone){
    var z = null;
    m.zones.forEach(function(x){ if(x.id === b.zone) z = x; });
    if(!z) return [];
    return z.points.map(function(p){ return { n:p.value, label:numPointLabel(p.id) }; });
  }
  return b.vals ? b.vals(m) : [];
}

function numBlockAux(b, m){
  return (b && m && b.aux) ? b.aux(m) : [];
}

/* Схлопує повтори, зберігаючи порядок першої появи.
   Пряма вимога замовниці: «якщо число повторюється (Таланти 7-5-16-7) —
   показати один раз із позначкою, що якості посилені». Вона ж рятує від
   дубля тлумачення на пів екрана. Підписи позицій при цьому НЕ втрачаються:
   вони збираються в labels, інакше з «А • Б» лишилась би одна літера. */
function numUniqueVals(values){
  var out = [], byN = {};
  values.forEach(function(v){
    var k = String(v.n);
    if(!byN[k]){
      byN[k] = { n:v.n, labels:[], count:0 };
      out.push(byN[k]);
    }
    byN[k].count++;
    if(v.label) byN[k].labels.push(v.label);
  });
  return out;
}

/* Коди помилок партнерського поля сервер віддає з префіксом partner_
   (partner_birthdate_format). Знімаємо префікс тут, а не дублюємо чотири
   ключі дати в SERVER_ERR_KEY: один список замість двох, які довелося б
   тримати синхронними. Повертаємо КОПІЮ, а не мутуємо оригінал: на
   префікс ще дивиться numCompatGo, щоб обрати, під яким полем показати
   відмову. Далі — звичайний serverErrText. */
function numErrData(data){
  if(data && typeof data.code === 'string' && data.code.indexOf('partner_') === 0){
    return { code: data.code.slice('partner_'.length), error: data.error };
  }
  return data;
}

/* Явна декларація неперекладеного контенту (ТЗ §6.3: «Мовчазна українська
   підстановка — заборонена»). Плашка вставляється ПЕРЕД контейнером, а не
   всередину: #num-egrid — це grid, і сторонній блок усередині зайняв би
   комірку й поїхав би разом із числами. */
function numLangNote(containerId){
  var host = document.getElementById(containerId);
  if(!host || !host.parentNode) return;
  var noteId = containerId + '-lang';
  var note   = document.getElementById(noteId);
  var needed = NUM.contentLang && NUM.contentLang !== LANG;

  if(!needed){
    if(note && note.parentNode) note.parentNode.removeChild(note);
    return;
  }
  if(!note){
    note = document.createElement('div');
    note.id = noteId;
    note.className = 'num-panel num-panel-q num-lang-note';
    host.parentNode.insertBefore(note, host);
  }
  note.textContent = t('num_lang_note', 'Трактування наразі доступні українською');
}

/* Та сама маска ДД.ММ.РРРР, що на екрані реєстрації. Винесена у функцію,
   бо полів дати в модулі три (разова дата, своя і партнерська в сумісності). */
function numMaskDate(el){
  if(!el) return;
  el.addEventListener('input', function(e){
    var v = e.target.value.replace(/\D/g,'');
    if(v.length > 2) v = v.slice(0,2) + '.' + v.slice(2);
    if(v.length > 5) v = v.slice(0,5) + '.' + v.slice(5);
    e.target.value = v.slice(0,10);
  });
}

function numInlineErr(id, msg){
  var el = document.getElementById(id);
  if(!el) return;
  if(msg){ el.textContent = msg; el.classList.add('show'); }
  else   { el.textContent = ''; el.classList.remove('show'); }
}


/* ─── 1. ВХІД У МОДУЛЬ ─────────────────────────────────────────────────── */

function numOpen(){
  numRenderHome();
  pushScreen('num-home');
}

/* Два вигляди екрана:
   • звичайний — картка з датою профілю й три кнопки (рахувати / інша дата /
     сумісність);
   • «інша дата» (otherOnly) — РІВНО одна дія: ввести дату й натиснути
     «Розрахувати матрицю». Сюди веде і «Змінити дату» зі схеми, і «Розрахувати
     для іншої дати». Раніше тут стояли поле, три кнопки й дві однакові
     «Розрахувати матрицю» — екран був незрозумілий. Без дати в профілі
     звичайному вигляду рахувати нічого, тож одразу показуємо простий. */
/* Вхід «розробити нову матрицю»: одразу екран вводу дати. */
function numOpenNew(){
  numRenderHome(true);
  pushScreen('num-home');
  var inp = document.getElementById('num-other-inp');
  if(inp) inp.focus();
}

function numRenderHome(otherOnly){
  var bd   = S.profile.birthdate || '';
  var name = (S.profile.first_name || '').trim();
  var body = document.getElementById('num-home-body');
  if(!body) return;
  var simple = (otherOnly === true) || !bd;

  var h = '';
  if(simple){
    /* Разова дата. Свідомо НЕ пишеться в профіль: користувач вводить її, щоб
       подивитись чужу матрицю, а не щоб змінити власну дату народження. */
    h += '<div class="num-panel num-stack num-other-form">';
    h +=   '<div class="num-card-title">' + escHtml(t('num_other_title','Введи іншу дату народження')) + '</div>';
    if(!bd){
      h += '<div class="num-hint">' + escHtml(t('num_no_birthdate',
           'У профілі немає дати народження. Введи її нижче — матриця порахується разово, профіль не зміниться.')) + '</div>';
    }
    h +=   '<div class="igrp">';
    h +=     '<label class="ilbl" for="num-other-inp">' + escHtml(t('num_other_label','ДД.ММ.РРРР')) + '</label>';
    h +=     '<input class="inp" id="num-other-inp" type="text" inputmode="numeric" placeholder="29.07.1989" maxlength="10">';
    h +=     '<div class="ierr" id="num-other-err"></div>';
    h +=   '</div>';
    h +=   '<button class="btn bp" id="num-other-go">' + escHtml(t('num_btn_calc','Розрахувати матрицю')) + '</button>';
    h += '</div>';
  } else {
    h += '<div class="num-panel num-stack">';
    h +=   '<div class="num-card-title">' + escHtml(name || t('num_you','Твоя матриця')) + '</div>';
    h +=   '<div class="num-row"><span class="num-row-k">' + escHtml(t('num_birthdate','Дата народження')) + '</span>' +
           '<span class="num-row-v">' + escHtml(bd) + '</span></div>';
    h += '</div>';
    h += '<button class="btn bp" id="num-btn-calc">' +
         escHtml(t('num_btn_calc','Розрахувати матрицю')) + '</button>';
    h += '<button class="btn bg" id="num-btn-other">' +
         escHtml(t('num_btn_other','Розрахувати для іншої дати')) + '</button>';
    h += '<button class="btn bg" id="num-btn-compat">' +
         escHtml(t('num_btn_compat','Розрахувати сумісність')) + '</button>';
  }

  body.innerHTML = h;

  if(simple){
    var inp = document.getElementById('num-other-inp');
    numMaskDate(inp);
    if(inp) inp.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){ e.preventDefault(); numOtherGo(); }
    });
    var btnGo = document.getElementById('num-other-go');
    if(btnGo) btnGo.addEventListener('click', numOtherGo);
    return;
  }

  var btnCalc = document.getElementById('num-btn-calc');
  if(btnCalc) btnCalc.addEventListener('click', function(){ numCalc(bd, this); });

  var btnOther = document.getElementById('num-btn-other');
  if(btnOther) btnOther.addEventListener('click', function(){
    numRenderHome(true);
    var i2 = document.getElementById('num-other-inp');
    if(i2) i2.focus();
  });

  var btnCompat = document.getElementById('num-btn-compat');
  if(btnCompat) btnCompat.addEventListener('click', function(){
    numRenderCompatForm();
    pushScreen('num-compat');
  });
}

function numOtherGo(){
  var inp = document.getElementById('num-other-inp');
  if(!inp) return;
  numInlineErr('num-other-err', '');
  var val = inp.value.trim();
  if(!val){
    numInlineErr('num-other-err', t('err_birth_required','Вкажи дату народження'));
    return;
  }
  numCalc(val, document.getElementById('num-other-go'), 'num-other-err');
}


/* ─── 2. РОЗРАХУНОК ────────────────────────────────────────────────────── */

/* errId — куди покласти помилку валідації дати. Якщо поля немає (кнопка
   бере дату з профілю), падаємо на тост: інакше відмова зникла б без сліду. */
function numCalc(birthdate, btn, errId){
  var label = btn ? btn.textContent : '';
  if(btn){ btn.disabled = true; btn.textContent = t('num_calculating','Рахуємо...'); }

  apiFetch('/api/numerology/matrix', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ birthdate: birthdate || '' })
  }).then(function(data){
    if(btn){ btn.disabled = false; btn.textContent = label; }
    if(!data.ok){
      var d = numErrData(data);
      var msg = serverErrText(d, 'num_err_generic', 'Не вдалось порахувати матрицю');
      if(errId) numInlineErr(errId, msg); else showErrToast(msg);
      return;
    }
    NUM.active           = data.matrix;
    NUM.mode             = 'self';
    NUM.birthdate        = data.birthdate;
    NUM.partnerBirthdate = null;
    NUM.hints            = data.hints;
    NUM.energyTitles     = data.energyTitles;
    NUM.contentLang      = data.contentLang;
    if(data.karmicTail) NUM.tailCache[String(data.matrix.karmicTail)] = data.karmicTail;

    numRenderAll();
    pushScreen('num-scheme');
  }).catch(function(){
    if(btn){ btn.disabled = false; btn.textContent = label; }
    showErrToast(t('err_network','Помилка мережі'));
  });
}

/* Один вхід у перемальовку всіх п'яти екранів. Малювати ліниво, за кліком
   по вкладці, означає ловити порожній екран щоразу, коли вкладку відкрили
   раніше, ніж встиг відпрацювати рендер; а тут це лише рядки, не запити. */
function numRenderAll(){
  numRenderScheme();
  numRenderHealth();
  numRenderProg();
  numRenderEnergies();
}


/* ─── 3. СХЕМА ─────────────────────────────────────────────────────────── */

function numSchemeSub(){
  if(NUM.mode === 'pair'){
    return fmt(t('num_sub_pair','Матриця пари · {a} + {b}'),
               { a: NUM.birthdate || '—', b: NUM.partnerBirthdate || '—' });
  }
  return fmt(t('num_sub_self','Матриця за датою {a}'), { a: NUM.birthdate || '—' });
}

function numRenderScheme(){
  var m = NUM.active;
  if(!m) return;

  /* Підпис малий, дата — велика. Для пари дата — «a + b». */
  var lbl = document.getElementById('num-scheme-lbl');
  var sub = document.getElementById('num-scheme-sub');
  if(NUM.mode === 'pair'){
    if(lbl) lbl.textContent = t('num_lbl_pair', 'Матриця пари');
    if(sub) sub.textContent = (NUM.birthdate || '—') + ' + ' + (NUM.partnerBirthdate || '—');
  } else {
    if(lbl) lbl.textContent = t('num_lbl_self', 'Матриця за датою');
    if(sub) sub.textContent = NUM.birthdate || '—';
  }

  var title = document.getElementById('num-scheme-title');
  if(title){
    /* Заголовок несе data-i18n, тому перекриваємо і ключ, і збережене
       джерело — інакше наступний applyI18n поверне «Матриця долі».
       Обидва t() виписані літералами навмисно: t(змінна) не видно ні
       тесту покриття локалей, ні людині, яка шукає ключ грепом. */
    var isPair = (NUM.mode === 'pair');
    title.dataset.i18n    = isPair ? 'num_title_pair' : 'num_title';
    title.dataset.i18nSrc = isPair ? 'Матриця пари'   : 'Матриця долі';
    title.textContent     = isPair ? t('num_title_pair', 'Матриця пари')
                                   : t('num_title', 'Матриця долі');
  }

  /* Числа в кружки. Склад і порядок позицій задає SVG-шаблон, згенерований
     з numerology/registry.py — саме тому тут немає власного списку 33 ID,
     який довелося б синхронізувати вручну. */
  document.querySelectorAll('#num-svg [data-point-id]').forEach(function(g){
    var pid = g.dataset.pointId;
    g.classList.remove('sel');
    if(NUM_BADGE_PTS[pid]) return;      // бейдж лишається літерою
    var txt = g.querySelector('text');
    var val = m.points[pid];
    /* Прочерк, а не порожньо: якщо позиція раптом зникне з відповіді, це
       має бути видно на схемі, а не мовчки розчинитись. */
    if(txt) txt.textContent = (val === undefined || val === null) ? '\u2013' : String(val);
  });

  numRenderCodes();
  numRenderAgeScale();
  numRenderBlockGrid();
  numRenderHintsPanel();
  numPairCalcOnly();
}

/* Матриця ПАРИ — лише розрахунок: схема й панель кодів.

   Рішення замовниці: у сумісності зовсім інші блоки і власні пояснення, а
   блоки й тлумачення тут — від особистої матриці. Показані на числах пари,
   вони читались би як розбір пари, яким не є. Тому в режимі пари немає ні
   сітки блоків, ні підказок, ні шторки з тлумаченням по тапу на кружок.
   Кружки при цьому виходять із табуляції: role="button", який нічого не
   відкриває, бреше про поведінку. */
function numPairCalcOnly(){
  var pair = (NUM.mode === 'pair');
  setVis('num-pick', !pair);
  setVis('num-hints-toggle', !pair);
  var svg = document.getElementById('num-svg');
  if(!svg) return;
  if(pair) svg.classList.add('num-static');
  else     svg.classList.remove('num-static');
  svg.querySelectorAll('[data-point-id]').forEach(function(g){
    g.setAttribute('tabindex', pair ? '-1' : '0');
  });
}

/* Сітка блоків під схемою — головна дія екрана.

   Тут була смуга вкладок (numRenderTabs). Вона роздавала блоки по п'яти
   екранах, і людина не вибирала блок: щоб дізнатись, що взагалі є, треба
   було відкрити кожну вкладку.

   Кнопки заповнюють ряд до краю, без горизонтальної прокрутки — той самий
   урок, що на вкладці «Тарифи»: обрізаний правим краєм чіп читається як
   «щось не влізло», а не як «прокрути». Це вже перевірялось на пристрої.

   Числа поруч із назвою — не прикраса: саме вони перетворюють перелік назв
   на власну матрицю. Показуємо унікальні: у зоні число може повторюватись,
   і «9 · 9 · 18» у підписі виглядало б як помилка розрахунку. */
function numRenderBlockGrid(){
  var box = document.getElementById('num-bgrid');
  if(!box) return;
  /* Пара — лише розрахунок (numPairCalcOnly). Порожній контейнер ховає
     `.num-stack > :empty`, тож і проміжку по собі не лишить. */
  if(NUM.mode === 'pair'){ box.innerHTML = ''; return; }
  var m = NUM.active;

  var h = '';
  NUM_BLOCKS.forEach(function(cat){
    h += '<div class="num-bcat">' + escHtml(t(cat.key, cat.uk)) + '</div>';
    h += '<div class="num-bgroup">';
    cat.blocks.forEach(function(b){
      var uniq = numUniqueVals(numBlockValues(b, m));
      h += '<button class="num-bbtn" data-block="' + escHtml(b.id) + '">';
      h +=   '<span class="num-bbtn-t">' + escHtml(t(b.key, b.uk)) + '</span>';
      if(uniq.length){
        h += '<span class="num-bbtn-n">' + escHtml(uniq.map(function(u){ return u.n; }).join(' · ')) + '</span>';
      }
      h += '</button>';
    });
    h += '</div>';
  });

  box.innerHTML = h;
  box.querySelectorAll('.num-bbtn').forEach(function(btn){
    btn.addEventListener('click', function(){ numOpenBlock(btn.dataset.block); });
  });
}

/* numRenderPointsList видалено разом із блоком «Усі 33 позиції списком»
   (index.html). Функція малювала другий, текстовий переказ схеми; тап по
   кружку самої схеми веде в той самий numOpenPoint, тож нічого, крім
   дубля, з нею не зникло. */

/* Підказки зон під схемою. За замовчуванням сховані: 12 абзаців над схемою
   відсувають саму схему за межу екрана, а прийшли дивитись саме на неї. */
function numRenderHintsPanel(){
  var box = document.getElementById('num-scheme-hints');
  if(!box || !NUM.active) return;

  if(!NUM.showHints || NUM.mode === 'pair'){
    box.hidden = true;
    box.innerHTML = '';
    numLangNote('num-scheme-hints');
    return;
  }

  var zh = (NUM.hints && NUM.hints.zones) || {};
  var h = '';
  NUM.active.zones.forEach(function(z){
    var meta = zh[z.id] || {};
    h += '<div class="num-panel num-stack">';
    h +=   '<div class="num-card-title">' + escHtml(meta.title || z.title) + '</div>';
    if(meta.points) h += '<div class="num-card-pts">' + escHtml(meta.points) + '</div>';
    if(meta.hint)   h += '<div class="num-hint">' + escHtml(meta.hint) + '</div>';
    h += '</div>';
  });
  box.innerHTML = h;
  box.hidden = false;
  numLangNote('num-scheme-hints');
}

function numToggleHints(){
  NUM.showHints = !NUM.showHints;
  var btn = document.getElementById('num-hints-toggle');
  if(btn){
    /* Перемикаємо і ключ, і data-i18n-src разом: applyI18n бере src як
       фолбек, і залишений старий src показав би україномовному
       користувачу «Показати підказки» на кнопці «Приховати». */
    btn.dataset.i18n    = NUM.showHints ? 'num_hints_hide' : 'num_hints_show';
    btn.dataset.i18nSrc = NUM.showHints ? 'Приховати підказки' : 'Показати підказки';
    btn.textContent     = NUM.showHints ? t('num_hints_hide', 'Приховати підказки')
                                        : t('num_hints_show', 'Показати підказки');
  }
  numRenderHintsPanel();
}


/* ─── 3-bis. ПІДСУМКОВІ КОДИ, РОДОВІ ЛІНІЇ, ВІКОВА ШКАЛА ─────────────────

   Усі числа тут ПРИХОДЯТЬ З СЕРВЕРА (numerology/core.py: _ancestry,
   _age_contour). У цьому файлі немає жодного додавання чисел матриці —
   інакше з'явився б другий калькулятор, і розійшлися б вони мовчки. */

/* Вік у роках із «ДД.ММ.РРРР». Єдине число, якого сервер не віддає:
   він не знає «сьогодні» користувача. */
function numAgeYears(bd){
  var mm = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(bd || ''));
  if(!mm) return null;
  var d = +mm[1], mo = +mm[2], y = +mm[3];
  var now = new Date(), nm = now.getMonth() + 1;
  var age = now.getFullYear() - y;
  if(nm < mo || (nm === mo && now.getDate() < d)) age--;
  return (age >= 0 && age <= 150) ? age : null;
}

/* Панель кодів НАД схемою — те, з чого починають читати за еталоном
   замовниці. Формулювання й роздільник «, » — як на еталонному фото.
   На самій схемі цих чисел немає: там їх немає і на фото, а дубль на
   діагоналях лише закривав родові стрілки. */
function numRenderCodes(){
  var box = document.getElementById('num-codes');
  if(!box) return;

  /* Чистимо першою дією й безумовно: :empty у CSS ховає панель, тож
     порожній вузол не залишить на екрані ні рамки, ні відступу. */
  box.innerHTML = '';

  var m = NUM.active;
  if(!m) return;
  var a = m.ancestry || {};
  var rows = [];

  if(NUM.mode === 'pair'){
    rows.push([t('num_codes_birth', 'Дата народження'),
               (NUM.birthdate || '\u2013') + ' + ' + (NUM.partnerBirthdate || '\u2013')]);
  } else if(NUM.birthdate){
    rows.push([t('num_codes_birth', 'Дата народження'), NUM.birthdate]);
    var age = numAgeYears(NUM.birthdate);
    if(age !== null) rows.push([t('num_codes_age', 'Вік'), age]);
  }

  if(a.maleCode)   rows.push([t('num_codes_male',   'Троїчний код чоловічого роду'), a.maleCode.join(', ')]);
  if(a.femaleCode) rows.push([t('num_codes_female', 'Троїчний код жіночого роду'),   a.femaleCode.join(', ')]);
  if(a.power !== undefined && a.power !== null){
    rows.push([t('num_codes_power', 'Родова сила'), a.power]);
  }
  /* Внутрішньої сили в матриці ПАРИ немає: compat._ancestry_pair() її не
     рахує. Рядок тому умовний, а не «завжди з прочерком» — прочерк
     читався б як «не порахувалось». */
  if(a.innerTotal !== undefined && a.innerTotal !== null){
    rows.push([t('num_codes_inner', 'Код внутрішньої сили'),
               a.innerMale + ', ' + a.innerFemale + ', ' + a.innerTotal]);
  }

  var h = '';
  rows.forEach(function(r){
    h += '<div class="num-code-k">' + escHtml(String(r[0])) + '</div>';
    h += '<div class="num-code-v">' + escHtml(String(r[1])) + '</div>';
  });
  box.innerHTML = h;
}

/* ─── Вікова шкала по периметру ──────────────────────────────────────────

   Геометрія РАХУЄТЬСЯ, а не переписана з макета, і причина конкретна:
   склад контуру задає numerology/registry.py (AGE_ANCHORS +
   AGE_SUBNODE_SUFFIXES). Зафіксований список координат розійшовся б із
   даними на першій же правці реєстру — мовчки й на бойовому екрані.

   Розкладка — за еталонним фото замовниці:
   • шкала лежить на ТОНКОМУ восьмикутнику .num-age-oct з розмітки; його
     вершини — зовнішні краї великих кіл (380 + 43 = 423), а не їхні центри;
   • на кожній грані сім вузлів із кроком NUM_AGE_GAP, симетрично від
     середини. Середній (5, 15, 25 …) — кружечок ⊙ і підпис «N років»,
     решта — крапка й діапазон «1-2» дрібним курсивом;
   • число енергії стоїть ЗОВНІ грані, вік — ВСЕРЕДИНІ;
   • опорні вузли (0, 10, 20 …) власного числа не мають: їхнє число — це
     сам великий кружок вершини. Біля нього лише «N років» зі стрілкою від
     бейджа-літери (.num-vtx у розмітці);
   • замикаючий «80» — та сама вершина A, що й «0», тому не малюється. */
var NUM_SVG_NS   = 'http://www.w3.org/2000/svg';
var NUM_AGE_A0   = 180;            // напрямок вершини «0» — точка A, ліворуч
var NUM_AGE_STEP = 45;             // 45° на грань восьмикутника
var NUM_AGE_SUB  = 8;              // 8 вузлів на грань (одне десятиліття)
var NUM_AGE_OCT  = 423;            // радіус вершин .num-age-oct у розмітці
var NUM_AGE_GAP  = 29;             // крок між сусідніми вузлами грані
/* Зсуви підписів від вузла — у знаках зовнішньої нормалі грані (sx, sy).
   Круті (бічні) грані розносять число й вік по горизонталі, пологі (верхні
   й нижні) — переважно по вертикалі: так на еталоні, і так жоден підпис не
   лягає на саму грань. «M» — для середнього вузла з маркером ⊙: і кружечок
   ширший, і підпис «N років» довший за діапазон. */
var NUM_AGE_OFF = {
  steep:   { val: [10, 0], lbl: [-7, 0], valM: [13, 0], lblM: [-10, 0] },
  shallow: { val: [9, 5],  lbl: [2, -9], valM: [13, 5], lblM: [-6, -18] }
};

function numAgeIsAnchor(i){
  return i % NUM_AGE_SUB === 0;
}

function numR1(v){ return Math.round(v * 10) / 10; }

/* Грань k (від вершини k до k+1): середина, одиничний напрямок і
   зовнішня нормаль. */
function numAgeEdge(k){
  var rad = Math.PI / 180;
  var a0  = (NUM_AGE_A0 + NUM_AGE_STEP * k) * rad;
  var a1  = a0 + NUM_AGE_STEP * rad;
  var an  = a0 + NUM_AGE_STEP * rad / 2;
  var x0 = 500 + NUM_AGE_OCT * Math.cos(a0), y0 = 500 + NUM_AGE_OCT * Math.sin(a0);
  var x1 = 500 + NUM_AGE_OCT * Math.cos(a1), y1 = 500 + NUM_AGE_OCT * Math.sin(a1);
  var len = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
  return { mx: (x0 + x1) / 2, my: (y0 + y1) / 2,
           dx: (x1 - x0) / len, dy: (y1 - y0) / len,
           nx: Math.cos(an), ny: Math.sin(an) };
}

/* createElementNS, а не innerHTML: рядок, вставлений в SVG через innerHTML,
   парситься в контексті батька і в частині вебв'ю осідає в HTML-просторі
   імен — вузли є в дереві, але не малюються. Тут це коштує три рядки. */
function numSvgNode(tag, attrs, text){
  var el = document.createElementNS(NUM_SVG_NS, tag);
  Object.keys(attrs).forEach(function(k){ el.setAttribute(k, attrs[k]); });
  if(text !== undefined && text !== null) el.textContent = String(text);
  return el;
}

/* «N років» біля вершини — стрілка від бейджа-літери в бік підпису.
   Координати й бік бейджа ЧИТАЮТЬСЯ з розмітки (.num-vtx), а не рахуються
   вдруге: одна геометрія на двох. Колір стрілки — колір самого бейджа. */
function numAgeAnchorLabel(g, node, text){
  var v = document.querySelector('#num-svg [data-vtx="' + node.pointId + '"]');
  var c = v && v.querySelector('circle');
  if(!c) return;
  var bx = +c.getAttribute('cx'), by = +c.getAttribute('cy');
  var side = +v.getAttribute('data-side') < 0 ? -1 : 1;
  var ink = c.getAttribute('fill') || '#1A1A1A';

  g.appendChild(numSvgNode('line', {
    x1: numR1(bx + side * 13), y1: by, x2: numR1(bx + side * 24), y2: by,
    stroke: ink, 'class': 'num-age-arr' }, null));
  g.appendChild(numSvgNode('path', {
    d: 'M' + numR1(bx + side * 30) + ',' + by +
       ' L' + numR1(bx + side * 23) + ',' + numR1(by - 3.4) +
       ' L' + numR1(bx + side * 23) + ',' + numR1(by + 3.4) + ' z',
    fill: ink }, null));
  g.appendChild(numSvgNode('text', {
    x: numR1(bx + side * 34), y: by,
    'class': 'num-age-y num-age-a ' + (side > 0 ? 'num-age-s' : 'num-age-e') }, text));
}

function numRenderAgeScale(){
  var g = document.getElementById('num-age-scale');
  if(!g) return;

  /* Чистка — ПЕРША дія й безумовна. Ранній вихід після неї безпечний;
     ранній вихід до неї лишив би на схемі шкалу попередньої дати. */
  while(g.firstChild) g.removeChild(g.firstChild);

  var m = NUM.active;
  if(!m || !m.ageContour) return;

  var years = t('num_years', 'років');
  var last = m.ageContour.length - 1;
  m.ageContour.forEach(function(node, i){
    if(i === last) return;                  // «80» — та сама вершина A, що й «0»

    /* Сорт вузла за ІНДЕКСОМ: тут потрібна геометрія (чи сидить вузол у
       вершині), а не дані. node.anchor збігається з нею лише поки в
       реєстрі 8 підвузлів на грань — і на цьому збігу тримався б баг. */
    if(numAgeIsAnchor(i)){
      numAgeAnchorLabel(g, node, node.label + ' ' + years);
      return;
    }

    var k = Math.floor(i / NUM_AGE_SUB);
    var e = numAgeEdge(k);
    var s = (i - k * NUM_AGE_SUB - NUM_AGE_SUB / 2) * NUM_AGE_GAP;
    var x = e.mx + e.dx * s, y = e.my + e.dy * s;
    var sx = e.nx < 0 ? -1 : 1, sy = e.ny < 0 ? -1 : 1;
    var off = Math.abs(e.nx) > Math.abs(e.ny) ? NUM_AGE_OFF.steep : NUM_AGE_OFF.shallow;
    /* Рівний рік (5, 15 …) пізнаємо з підпису: у діапазонів є дефіс. */
    var mark = String(node.label).indexOf('-') === -1;
    var ov = mark ? off.valM : off.val;
    var ol = mark ? off.lblM : off.lbl;

    if(mark){
      g.appendChild(numSvgNode('circle',
        { cx: numR1(x), cy: numR1(y), r: 4.6, 'class': 'num-age-mk' }, null));
    }
    g.appendChild(numSvgNode('circle',
      { cx: numR1(x), cy: numR1(y), r: mark ? 1.7 : 2.1, 'class': 'num-age-dot' }, null));

    /* Число — зовні грані; текст тягнеться ВІД неї, тому якір — з її боку. */
    g.appendChild(numSvgNode('text', {
      x: numR1(x + sx * ov[0]), y: numR1(y + sy * ov[1]),
      'class': (mark ? 'num-age-v num-age-vb ' : 'num-age-v ') +
               (sx > 0 ? 'num-age-s' : 'num-age-e') }, node.value));
    /* Вік — усередині, дзеркально. */
    g.appendChild(numSvgNode('text', {
      x: numR1(x + sx * ol[0]), y: numR1(y + sy * ol[1]),
      'class': (mark ? 'num-age-y ' : 'num-age-l ') +
               (sx > 0 ? 'num-age-e' : 'num-age-s') },
      mark ? node.label + ' ' + years : node.label));
  });
}

/* Повноекранний перегляд схеми.

   Перша версія збільшувала схему ВСЕРЕДИНІ панелі (прокрутка в рамці на
   78vh) — замовниця попросила на весь екран. Тому SVG переноситься в
   оверлей #num-zoom і назад, а не клонується: клон дублював би id маркерів
   і фільтра та втратив би обробники тапу по кружках.

   Масштаб — ширина схеми в ширинах екрана. Стартовий заповнює висоту:
   уся схема по вертикалі, а вбік — гортати. Щипок двома пальцями й кнопки
   ± змінюють його навколо точки під пальцями / центру екрана. Щипок
   самого WebView вимкнений (maximum-scale=1), тому він тут власний. */
var NUM_ZOOM_MIN  = 1;
var NUM_ZOOM_MAX  = 6;
var NUM_ZOOM_STEP = 1.5;

function numZoomInner(view){
  var cs = getComputedStyle(view);
  return {
    w: view.clientWidth  - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
    h: view.clientHeight - parseFloat(cs.paddingTop)  - parseFloat(cs.paddingBottom)
  };
}

/* z — новий масштаб; (fx, fy) — точка в межах екрана, яка має лишитись
   під пальцем. Рахуємо через getBoundingClientRect до й після: так відступи,
   safe-area й auto-поля центрування не треба відтворювати в арифметиці. */
function numZoomSet(z, fx, fy){
  var view = document.getElementById('num-zoom-view');
  var svg  = document.getElementById('num-svg');
  if(!view || !svg) return;
  z = Math.max(NUM_ZOOM_MIN, Math.min(NUM_ZOOM_MAX, z));
  var vr = view.getBoundingClientRect();
  var r0 = svg.getBoundingClientRect();
  var px = r0.width  ? (vr.left + fx - r0.left) / r0.width  : 0.5;
  var py = r0.height ? (vr.top  + fy - r0.top)  / r0.height : 0.5;
  NUM.zoom = z;
  svg.style.width = Math.round(z * numZoomInner(view).w) + 'px';
  var r1 = svg.getBoundingClientRect();
  view.scrollLeft += (r1.left + px * r1.width)  - (vr.left + fx);
  view.scrollTop  += (r1.top  + py * r1.height) - (vr.top  + fy);
}

function numZoomStep(k){
  var view = document.getElementById('num-zoom-view');
  if(!view || !NUM.zoom) return;
  numZoomSet(NUM.zoom * k, view.clientWidth / 2, view.clientHeight / 2);
}

function numZoomOpen(){
  var ov   = document.getElementById('num-zoom');
  var view = document.getElementById('num-zoom-view');
  var wrap = document.getElementById('num-svg-wrap');
  var svg  = document.getElementById('num-svg');
  if(!ov || !view || !wrap || !svg || NUM.zoom) return;

  /* Панель тримає свою висоту: інакше без схеми вона схлопнеться, сторінка
     під оверлеєм підскочить, і після закриття людина опиниться деінде. */
  wrap.style.minHeight = wrap.offsetHeight + 'px';
  view.appendChild(svg);
  setVis(ov, true);
  document.body.classList.add('num-zoom-on');

  var vb = svg.viewBox && svg.viewBox.baseVal;
  var ratio = (vb && vb.width) ? vb.height / vb.width : 1;
  var inner = numZoomInner(view);
  NUM.zoom = 1;
  svg.style.width = Math.round(inner.w) + 'px';
  numZoomSet(inner.h / (inner.w * ratio), view.clientWidth / 2, view.clientHeight / 2);
  view.scrollLeft = (view.scrollWidth  - view.clientWidth)  / 2;
  view.scrollTop  = (view.scrollHeight - view.clientHeight) / 2;
}

function numZoomClose(){
  var ov   = document.getElementById('num-zoom');
  var wrap = document.getElementById('num-svg-wrap');
  var svg  = document.getElementById('num-svg');
  if(!ov || !wrap || !svg || !NUM.zoom) return;
  svg.style.width = '';
  wrap.appendChild(svg);
  wrap.style.minHeight = '';
  setVis(ov, false);
  document.body.classList.remove('num-zoom-on');
  NUM.zoom = 0;
}

/* Щипок. passive:false обов'язковий: без preventDefault WebView спробує
   прокрутити панель тими самими двома пальцями. */
function numZoomBindPinch(){
  var view = document.getElementById('num-zoom-view');
  if(!view) return;
  var pinch = null;
  function gap(ts){
    var dx = ts[0].clientX - ts[1].clientX, dy = ts[0].clientY - ts[1].clientY;
    return Math.sqrt(dx * dx + dy * dy) || 1;
  }
  view.addEventListener('touchstart', function(e){
    if(e.touches.length === 2){ pinch = { d: gap(e.touches), z: NUM.zoom }; e.preventDefault(); }
  }, { passive: false });
  view.addEventListener('touchmove', function(e){
    if(!pinch || e.touches.length !== 2) return;
    e.preventDefault();
    var vr = view.getBoundingClientRect();
    numZoomSet(pinch.z * gap(e.touches) / pinch.d,
               (e.touches[0].clientX + e.touches[1].clientX) / 2 - vr.left,
               (e.touches[0].clientY + e.touches[1].clientY) / 2 - vr.top);
  }, { passive: false });
  view.addEventListener('touchend', function(e){ if(e.touches.length < 2) pinch = null; });
  /* Щипок трекпада в Telegram Desktop приходить як wheel із ctrlKey. */
  view.addEventListener('wheel', function(e){
    if(!e.ctrlKey) return;
    e.preventDefault();
    var vr = view.getBoundingClientRect();
    numZoomSet(NUM.zoom * Math.exp(-e.deltaY / 200), e.clientX - vr.left, e.clientY - vr.top);
  }, { passive: false });
}

/* ─── 4. ШТОРКА: ТОЧКА · ЗОНА · ЕНЕРГІЯ ────────────────────────────────── */

function numSheetOpen(title, sub, bodyHtml){
  var ov = document.getElementById('num-sheet');
  if(!ov) return;
  document.getElementById('num-sheet-title').textContent = title;
  var body = document.getElementById('num-sheet-body');
  body.innerHTML = (sub ? '<div class="num-sheet-sub">' + escHtml(sub) + '</div>' : '') + bodyHtml;
  body.scrollTop = 0;
  ov.classList.add('open');
  numLangNote('num-sheet-body');
}

function numSheetClose(){
  var ov = document.getElementById('num-sheet');
  if(ov) ov.classList.remove('open');
  document.querySelectorAll('#num-svg .num-pt.sel').forEach(function(g){ g.classList.remove('sel'); });
}

/* Зони, у які входить точка. Беремо з уже отриманої матриці, а не з окремої
   мапи в JS: склад зон визначає numerology/registry.py, і другий перелік
   тут розійшовся б із ним на першій же правці складу зони. */
function numZonesOfPoint(pid){
  if(!NUM.active) return [];
  return NUM.active.zones.filter(function(z){
    return z.points.some(function(p){ return p.id === pid; });
  });
}

function numOpenPoint(pid){
  if(!NUM.active) return;
  /* Пара — лише розрахунок: тлумачень точки для неї немає (numPairCalcOnly). */
  if(NUM.mode === 'pair') return;
  var val = NUM.active.points[pid];

  document.querySelectorAll('#num-svg .num-pt.sel').forEach(function(g){ g.classList.remove('sel'); });
  var g = document.querySelector('#num-svg [data-point-id="' + pid + '"]');
  if(g) g.classList.add('sel');

  var zh = (NUM.hints && NUM.hints.zones) || {};
  var h  = '';

  h += '<div class="num-sect">' + escHtml(t('num_sheet_zones','Зони')) + '</div>';
  var zones = numZonesOfPoint(pid);
  if(!zones.length){
    h += '<p class="num-para">' + escHtml(t('num_sheet_no_zone',
         'Ця позиція не входить у жодну зону — вона читається як окрема енергія.')) + '</p>';
  }
  zones.forEach(function(z){
    var meta = zh[z.id] || {};
    h += '<div class="num-panel num-stack">';
    h +=   '<div class="num-card-title">' + escHtml(meta.title || z.title) + '</div>';
    if(meta.points) h += '<div class="num-card-pts">' + escHtml(meta.points) + '</div>';
    h +=   numValsHtml(z.values);
    if(meta.hint) h += '<div class="num-hint">' + escHtml(meta.hint) + '</div>';
    h += '</div>';
  });

  if(NUM.mode === 'pair'){
    h += '<div class="num-sect">' + escHtml(t('num_compat_title','Сумісність')) + '</div>';
    h += '<div id="num-sheet-compat">' + LOADING_HTML + '</div>';
  }

  h += '<div class="num-sect">' + escHtml(t('num_sheet_energy','Енергія')) + '</div>';
  h += '<div id="num-sheet-energy">' + LOADING_HTML + '</div>';

  numSheetOpen(numPointLabel(pid),
               fmt(t('num_sheet_point','Позиція {id} · значення {v}'),
                   { id: pid, v: (val === undefined || val === null) ? '—' : val }),
               h);

  numBindEnergyButtons(document.getElementById('num-sheet-body'));

  if(val === undefined || val === null){
    document.getElementById('num-sheet-energy').innerHTML = '';
    return;
  }
  numLoadEnergy(val, function(en, errMsg){
    var host = document.getElementById('num-sheet-energy');
    if(!host) return;                     // шторку встигли перемалювати
    host.innerHTML = errMsg ? errBlock(errMsg) : numEnergyHtml(en);
  });

  if(NUM.mode === 'pair'){
    numLoadBlockTexts('compat', [val], function(errMsg){
      var host = document.getElementById('num-sheet-compat');
      if(!host) return;
      if(errMsg){ host.innerHTML = errBlock(errMsg); return; }
      var item = numZoneText('compat', val);
      host.innerHTML = numBlockNoteHtml('compat') +
                       (item ? numBlockItemHtml(item) : '');
    });
  }
}

/* Кнопки-числа всередині контейнера відкривають тлумачення енергії.
   Вішаємо на контейнер при рендері, а не на document: .num-val живе і в
   шторці, і в блоках, і глобальний обробник ловив би кліки з обох. */
function numBindEnergyButtons(root){
  if(!root) return;
  root.querySelectorAll('.num-val[data-energy]:not([data-block])').forEach(function(b){
    b.addEventListener('click', function(){ numOpenEnergy(parseInt(b.dataset.energy, 10)); });
  });
}


/* ─── 5. ТЛУМАЧЕННЯ ЕНЕРГІЇ ────────────────────────────────────────────── */

function numLoadEnergy(n, cb){
  var key = String(n);
  if(NUM.energyCache[key]){ cb(NUM.energyCache[key], null); return; }

  apiFetch('/api/numerology/energy?n=' + encodeURIComponent(key)).then(function(data){
    if(!data.ok){
      var d = numErrData(data);
      cb(null, serverErrText(d, 'num_err_energy', 'Не вдалось завантажити тлумачення'));
      return;
    }
    NUM.energyCache[key] = data.energy;
    cb(data.energy, null);
  }).catch(function(){
    cb(null, t('err_network','Помилка мережі'));
  });
}

/* Сервер віддає plus/minus масивами, note — рядком. Приводимо тут, щоб
   рендер не розсипався, якщо контент колись стане одноабзацним. */
function numParas(val){
  if(!val) return '';
  var arr = Array.isArray(val) ? val : [val];
  return arr.map(function(p){ return '<p class="num-para">' + escHtml(String(p)) + '</p>'; }).join('');
}
function numList(val){
  if(!val || !val.length) return '';
  var arr = Array.isArray(val) ? val : [val];
  return '<ul class="num-ul">' + arr.map(function(p){
    return '<li>' + escHtml(String(p)) + '</li>';
  }).join('') + '</ul>';
}

function numEnergyHtml(en){
  var h = '';
  if(en.subtitle) h += '<div class="num-card-pts">' + escHtml(en.subtitle) + '</div>';
  h += '<div class="num-sect">' + escHtml(t('num_energy_plus','У плюсі')) + '</div>';
  h += numParas(en.plus);
  h += '<div class="num-sect num-sect-minus">' + escHtml(t('num_energy_minus','У мінусі')) + '</div>';
  h += numParas(en.minus);
  if(en.note){
    h += '<div class="num-sect">' + escHtml(t('num_energy_note','Примітка')) + '</div>';
    h += numParas(en.note);
  }
  return h;
}

function numOpenEnergy(n){
  if(!(n >= 1 && n <= 22)) return;
  var title = fmt(t('num_energy_title','Енергія {n}'), { n:n });
  var sub   = (NUM.energyTitles && NUM.energyTitles[String(n)]) || '';
  numSheetOpen(title, sub, LOADING_HTML);
  numLoadEnergy(n, function(en, errMsg){
    var body = document.getElementById('num-sheet-body');
    if(!body) return;
    var head = sub ? '<div class="num-sheet-sub">' + escHtml(sub) + '</div>' : '';
    body.innerHTML = head + (errMsg ? errBlock(errMsg) : numEnergyHtml(en));
    numLangNote('num-sheet-body');
  });
}

/* Кармічний хвіст — не «ще одна енергія», а окремий текст на трійку кодів,
   тому й ручка окрема (?context=karmic_tail&code=18-9-9). */
function numOpenKarmic(){
  if(!NUM.active) return;
  var code  = NUM.active.karmicTail.join('-');
  var title = t('num_karmic_title','Кармічний хвіст');

  function render(tail, errMsg){
    var body = document.getElementById('num-sheet-body');
    if(!body) return;
    var head = '<div class="num-sheet-sub">' + escHtml(code) + '</div>';
    if(errMsg){ body.innerHTML = head + errBlock(errMsg); numLangNote('num-sheet-body'); return; }
    var h = head;
    if(tail.theme) h += '<p class="num-para">' + escHtml(tail.theme) + '</p>';
    h += '<div class="num-sect">' + escHtml(t('num_karmic_past','Минулий досвід')) + '</div>' + numParas(tail.past);
    h += '<div class="num-sect">' + escHtml(t('num_karmic_now','Як проявляється зараз')) + '</div>' + numList(tail.nowSigns);
    h += '<div class="num-sect">' + escHtml(t('num_karmic_conflict','Внутрішній конфлікт')) + '</div>' + numParas(tail.conflict);
    h += '<div class="num-sect">' + escHtml(t('num_karmic_tasks','Задачі')) + '</div>' + numList(tail.tasks);
    h += '<div class="num-sect">' + escHtml(t('num_energy_plus','У плюсі')) + '</div>' + numParas(tail.plus);
    h += '<div class="num-sect">' + escHtml(t('num_karmic_questions','Питання до себе')) + '</div>' + numList(tail.questions);
    if(tail.focus) h += '<div class="num-sect">' + escHtml(t('num_karmic_focus','Фокус')) + '</div>' + numParas(tail.focus);
    body.innerHTML = h;
    numLangNote('num-sheet-body');
  }

  numSheetOpen(title, code, LOADING_HTML);

  var cached = NUM.tailCache[String(NUM.active.karmicTail)];
  if(cached){ render(cached, null); return; }

  apiFetch('/api/numerology/energy?context=karmic_tail&code=' + encodeURIComponent(code)).then(function(data){
    if(!data.ok){
      var d = numErrData(data);
      render(null, serverErrText(d, 'num_err_energy', 'Не вдалось завантажити тлумачення'));
      return;
    }
    NUM.tailCache[String(NUM.active.karmicTail)] = data.karmicTail;
    render(data.karmicTail, null);
  }).catch(function(){
    render(null, t('err_network','Помилка мережі'));
  });
}


/* ─── 6. СТОРІНКА БЛОКУ ────────────────────────────────────────────────── */

/* Числа зони НЕ сортуються і НЕ дедуплікуються: порядок значущий
   (M → N → K — це вхід у близькість, образ партнера, задача), а два
   однакових числа в різних точках — різні позиції, а не дубль. */
function numValsHtml(values){
  return '<div class="num-vals">' + values.map(function(v){
    return '<button class="num-val" data-energy="' + escHtml(String(v)) + '">' + escHtml(String(v)) + '</button>';
  }).join('') + '</div>';
}

/* Підказка «за що відповідає блок». Уже написана для всіх зон і блоків у
   content/uk/zones.json, тому тут нічого не вигадується: зони лежать у
   hints.zones, решта блоків — у hints.blocks. */
function numBlockHint(b){
  var hz = (NUM.hints && NUM.hints.zones)  || {};
  var hb = (NUM.hints && NUM.hints.blocks) || {};
  return (b.zone ? hz[b.zone] : hb[b.id]) || {};
}

/* Шар доступу до зонального тлумачення: що означає енергія САМЕ В ЦЬОМУ блоці.
   Повертає {n, title, paras, fallback} або null, якщо тексти блоку ще не
   приїхали.

   fallback=true означає: зонального тексту для цієї пари ще немає, показаний
   ЗАГАЛЬНИЙ опис Аркана. Замовниця написала прямо: «Не потрібно замінювати
   зональне тлумачення загальним описом Аркана» — і ми його не замінюємо, ми
   його ПІДПИСУЄМО. Мовчазна підстановка була б рівно тією забороненою
   помилкою; підписана — це чесний стан «текст у дорозі». Плашку малює
   numRenderBlockTexts, і без неї весь цей прапорець не має сенсу. */
function numZoneText(blockId, n){
  var byBlock = NUM.blockCache[blockId];
  if(!byBlock) return null;
  return byBlock[String(n)] || null;
}

/* Один запит на сторінку блоку, не по одному на число. Каталог зональних
   текстів — це 17 блоків × 22 енергії, і возити його разом із матрицею
   означало б щоразу платити за контент, з якого відкриють один блок. */
function numLoadBlockTexts(blockId, nums, cb){
  var missing = nums.filter(function(n){ return !numZoneText(blockId, n); });
  if(!missing.length){ cb(null); return; }

  apiFetch('/api/numerology/block?id=' + encodeURIComponent(blockId) +
           '&n=' + encodeURIComponent(nums.join(','))).then(function(data){
    if(!data.ok){
      cb(serverErrText(numErrData(data), 'num_err_energy', 'Не вдалось завантажити тлумачення'));
      return;
    }
    var store = NUM.blockCache[blockId] || (NUM.blockCache[blockId] = {});
    (data.items || []).forEach(function(it){ store[String(it.n)] = it; });
    /* null — теж відповідь: у блоку немає застереження. Пишемо як є,
       інакше блок без застереження успадкував би чуже з попереднього. */
    NUM.blockNote[blockId] = data.disclaimer || null;
    if(data.contentLang) NUM.contentLang = data.contentLang;
    cb(null);
  }).catch(function(){
    cb(t('err_network','Помилка мережі'));
  });
}

function numOpenBlock(id){
  var b = numBlockById(id);
  if(!b) return;
  /* Пункти «Додатково» — це наявні екрани, а не сторінки блоків. У реєстрі
     вони лежать разом із рештою навмисно: після зникнення смуги вкладок це
     єдиний вхід до них, і пункт, забутий у реєстрі, робить цілий екран
     недосяжним. */
  if(b.screen){ pushScreen(b.screen); return; }
  numRenderBlock(id);
  pushScreen('num-block');
}

/* Один екран на всі блоки. Структура — рівно та, яку задала замовниця:
   назва → за що відповідає → твої числа → значення кожного числа в цій зоні →
   короткий висновок → запрошення на консультацію → навчання → назад.

   Сторінка малюється МИТТЄВО, з числами, і лише тексти доїжджають запитом:
   числа вже пораховані локально, і показувати «Готуємо тлумачення…» над тим,
   що вже відоме, означало б вдавати генерацію там, де її немає. */
function numRenderBlock(id){
  var b   = numBlockById(id);
  var m   = NUM.active;
  var box = document.getElementById('num-block-body');
  if(!b || !m || !box) return;

  NUM.blockId = id;

  var title = document.getElementById('num-block-title');
  if(title){
    /* І ключ, і збережене джерело: applyI18n бере src як фолбек, і залишений
       чужий src показав би україномовному користувачу назву ПОПЕРЕДНЬОГО
       блоку. Той самий прийом, що в заголовку схеми. */
    title.dataset.i18n    = b.key;
    title.dataset.i18nSrc = b.uk;
    title.textContent     = t(b.key, b.uk);
  }

  var meta = numBlockHint(b);
  var uniq = numUniqueVals(numBlockValues(b, m));
  var aux  = numBlockAux(b, m);
  var nums = uniq.map(function(u){ return u.n; });
  var hasRepeat = uniq.some(function(u){ return u.count > 1; });

  /* Послуги (консультація, навчання, назад) стоять ЗВЕРХУ сторінки блоку —
     на прохання замовниці, щоб вони були видні одразу, без прокрутки до
     кінця тексту. Той самий екран обслуговує всі блоки, тож це діє для
     будь-якого розрахунку. */
  var consultHtml = '';
  consultHtml += '<div class="num-panel num-stack num-consult">';
  consultHtml +=   '<p class="num-para">' + escHtml(t('num_consult_text',
           'Це коротке тлумачення твого результату. На особистій консультації ми зможемо детальніше розібрати, як ці енергії проявляються саме у твоєму житті, де знаходиться твій ресурс і що може заважати його реалізації.')) + '</p>';
  consultHtml +=   '<button class="btn bp" id="num-consult-btn">' +
           escHtml(t('num_consult_btn','Розібрати детальніше з Аліною')) + '</button>';
  consultHtml += '</div>';
  consultHtml += '<button class="btn bg" id="num-forecast-btn">' +
       escHtml(t('num_forecast_btn','Замовити прогностику на 2027 рік')) + '</button>';
  consultHtml += '<button class="btn bg" id="num-club-btn">' +
       escHtml(t('num_club_btn','Вступити в закритий клуб')) + '</button>';
  consultHtml += '<button class="btn bg" id="num-all-btn">' +
       escHtml(t('num_all_btn','Всі послуги')) + '</button>';

  var h = '';

  /* 1–2. За що відповідає блок. */
  h += '<div class="num-panel num-stack">';
  if(meta.points) h += '<div class="num-card-pts">' + escHtml(meta.points) + '</div>';
  h +=   '<div class="num-hint">' + escHtml(meta.hint ||
           t('num_block_no_hint','Опис цього блоку готується.')) + '</div>';
  h += '</div>';

  /* 3. Числа користувача. */
  h += '<div class="num-sect">' + escHtml(t('num_block_numbers','Твої числа')) + '</div>';
  h += '<div class="num-bnums">';
  uniq.forEach(function(u){
    h += '<button class="num-bn" data-energy="' + escHtml(String(u.n)) + '">';
    h +=   '<span class="num-bn-v">' + escHtml(String(u.n)) + '</span>';
    if(u.count > 1) h += '<span class="num-bn-x">\u00D7' + u.count + '</span>';
    if(u.labels.length) h += '<span class="num-bn-l">' + escHtml(u.labels.join(' \u00B7 ')) + '</span>';
    h += '</button>';
  });
  h += '</div>';
  if(hasRepeat){
    h += '<div class="num-hint">' + escHtml(t('num_block_repeated',
         'Число повторюється в цьому блоці — його якості посилені. Показуємо його один раз.')) + '</div>';
  }
  if(aux.length){
    /* Допоміжні числа — проміжні ланки розрахунку (Небо і Земля для
       призначення). Окремим блоком вони показували б користувачу нашу
       арифметику; рядком усередині блоку — просто пояснюють, звідки взялось
       головне число. */
    h += '<div class="num-hint">' + escHtml(t('num_block_aux','Допоміжні числа')) + ': ' +
         escHtml(aux.map(function(a){ return a.label + ' \u2014 ' + a.n; }).join(' \u00B7 ')) + '</div>';
  }

  if(b.karmic){
    h += '<button class="btn bg bsm" id="num-karmic-btn">' +
         escHtml(t('num_karmic_open','Прочитати розбір')) + '</button>';
  }

  /* 4. Значення кожного числа в цій зоні — наповнює numRenderBlockTexts. */
  h += '<div class="num-sect">' + escHtml(t('num_block_meaning','Що означає кожне число саме тут')) + '</div>';
  h += '<div class="num-stack" id="num-block-texts">' + LOADING_HTML + '</div>';

  /* 5. Короткий висновок. Свідомо НЕ тлумачення: жодного твердження про
     людину, якого немає в затвердженому контенті, тут не з'являється. Це
     підказка, ЯК читати вже показане, — інакше довелось би вигадувати текст
     замість замовниці. */
  h += '<div class="num-sect">' + escHtml(t('num_block_summary_t','Коротко')) + '</div>';
  h += '<p class="num-para">' + escHtml(fmt(t('num_block_summary',
         'Цей блок тримають енергії {nums}. Читати їх варто разом: у матриці вони працюють одним вузлом, а не по черзі.'),
         { nums: nums.join(' \u00B7 ') })) + '</p>';

  box.innerHTML = consultHtml + h;

  box.querySelectorAll('.num-bn').forEach(function(btn){
    btn.addEventListener('click', function(){ numOpenEnergy(parseInt(btn.dataset.energy, 10)); });
  });
  var kb = document.getElementById('num-karmic-btn');
  if(kb) kb.addEventListener('click', numOpenKarmic);
  var cnb = document.getElementById('num-consult-btn');
  if(cnb) cnb.addEventListener('click', numConsultOpen);
  var fcb = document.getElementById('num-forecast-btn');
  if(fcb) fcb.addEventListener('click', function(){
    consultOpen(t('num_forecast_msg','Вітаю! Хочу замовити прогностику на 2027 рік. Підкажіть, будь ласка, як це зробити?'));
  });
  var clb = document.getElementById('num-club-btn');
  if(clb) clb.addEventListener('click', function(){
    consultOpen(t('num_club_msg','Вітаю! Хочу вступити в закритий клуб. Підкажіть, будь ласка, як це зробити?'));
  });
  var alb = document.getElementById('num-all-btn');
  if(alb) alb.addEventListener('click', svcOpenList);
  numLangNote('num-block-body');

  numRenderBlockTexts(id, nums, null);
  numLoadBlockTexts(id, nums, function(errMsg){
    /* Поки відповідь ішла, людина могла повернутись і відкрити інший блок:
       без цієї перевірки тексти першого домалювались би поверх другого. */
    if(NUM.blockId !== id) return;
    numRenderBlockTexts(id, nums, errMsg);
  });
}

/* Застереження методички — текстом, а не прапорцем, і ПЕРЕД тлумаченням.
   Методички здоров'я, прогностики, сумісності та кармічного хвоста вимагають
   його прямо («не встановлює діагноз», «не гарантує конкретної події»), тож
   воно не може бути хвостиком, який ніхто не доскролить. */
function numBlockNoteHtml(blockId){
  var note = NUM.blockNote[blockId];
  if(!note) return '';
  return '<div class="num-panel num-stack num-disclaimer">' +
           '<div class="num-disclaimer-h">' +
             escHtml(t('num_block_disclaimer','Важливо')) + '</div>' +
           '<p class="num-para">' + escHtml(String(note)) + '</p>' +
         '</div>';
}

/* Тіло одного тлумачення (без заголовка-числа): плашки стану, абзаци й
   розділи методички. Заголовки розділів («У ресурсі», «Можливі зони уваги»)
   приходять із контенту, а не з переліку на фронті: у шести методичок вони
   різні, і другий перелік тут розійшовся б із JSON. */
function numBlockItemHtml(item){
  /* Число, яке методичка свідомо не покриває (1 і 2 у призначенні, 1 у
     сумісності). Показуємо число з поміткою, а не ховаємо: якщо воно тут
     з'явилося, це або норма за методичкою, або баг РОЗРАХУНКУ — і другий
     випадок має лишитися видимим, а не бути з'їденим рендером. */
  if(item.outOfRange){
    return '<div class="num-fallback">' + escHtml(t('num_block_oor',
           'Методичка свідомо лишає це число без тлумачення в цьому блоці.')) +
           '</div>';
  }
  var h = '';
  if(item.fallback){
    h += '<div class="num-fallback">' + escHtml(t('num_block_general',
         'Загальний опис енергії; зональне тлумачення готується.')) + '</div>';
  }
  h += numParas(item.paras);
  (item.sections || []).forEach(function(s){
    h += '<div class="num-sec">';
    h +=   '<div class="num-sec-h">' + escHtml(String(s.h || '')) + '</div>';
    h +=   numParas(s.p);
    h +=   numList(s.li);
    h += '</div>';
  });
  return h;
}

function numBlockItemTitle(item){
  return item.title || fmt(t('num_energy_n','Енергія {n}'), { n:item.n });
}

/* Тлумачення числа В КОНТЕКСТІ БЛОКУ, а не загальний опис Аркана. Різниця
   принципова: те саме 9 у здоров'ї й у прогностиці — два різні тексти з
   двох різних методичок, і numOpenEnergy тут показав би не те. */
function numOpenBlockEnergy(blockId, n, sub){
  if(!(n >= 1 && n <= 22)) return;
  var head = sub ? '<div class="num-sheet-sub">' + escHtml(sub) + '</div>' : '';
  numSheetOpen(fmt(t('num_energy_n','Енергія {n}'), { n:n }), sub, LOADING_HTML);
  numLoadBlockTexts(blockId, [n], function(errMsg){
    var body = document.getElementById('num-sheet-body');
    if(!body) return;                      // шторку встигли перемалювати
    if(errMsg){ body.innerHTML = head + errBlock(errMsg); numLangNote('num-sheet-body'); return; }
    var item = numZoneText(blockId, n);
    body.innerHTML = head + numBlockNoteHtml(blockId) +
                     (item ? numBlockItemHtml(item) : '');
    numLangNote('num-sheet-body');
  });
}

/* Числа, які відкривають тлумачення в контексті блоку. Окремий біндер, а не
   numBindEnergyButtons: там data-energy веде в загальний довідник Арканів,
   тут — у методичку конкретного блоку. */
function numBindBlockButtons(root){
  if(!root) return;
  root.querySelectorAll('[data-block][data-energy]').forEach(function(b){
    b.addEventListener('click', function(){
      numOpenBlockEnergy(b.dataset.block, parseInt(b.dataset.energy, 10),
                         b.dataset.sub || '');
    });
  });
}

/* Натискне число для таблиць і сіток, де немає місця на кнопку 44 px. */
function numTapNum(blockId, v, sub){
  if(!(v >= 1 && v <= 22)) return escHtml(String(v));
  return '<button class="num-tapn" data-block="' + escHtml(blockId) +
         '" data-energy="' + v + '" data-sub="' + escHtml(sub) + '">' +
         escHtml(String(v)) + '</button>';
}

function numRenderBlockTexts(blockId, nums, errMsg){
  var host = document.getElementById('num-block-texts');
  if(!host) return;
  if(errMsg){ host.innerHTML = errBlock(errMsg); return; }

  var h = numBlockNoteHtml(blockId), ready = 0;
  nums.forEach(function(n){
    var item = numZoneText(blockId, n);
    if(!item) return;
    ready++;
    h += '<div class="num-panel num-stack">';
    h +=   '<div class="num-card-title">' + escHtml(numBlockItemTitle(item)) + '</div>';
    h +=   numBlockItemHtml(item);
    h += '</div>';
  });

  host.innerHTML = ready ? h : LOADING_HTML;
}

/* «Навчитися розраховувати самостійно» веде на оплату курсу (WayForPay).
   Два варіанти — щоб замовниця могла порівняти на живому:
     'popup'  — вспливаюче віконце з коротким текстом і кнопкою «Перейти до оплати»;
     'direct' — посилання відкривається одразу по натисканню кнопки.
   Змінити за замовчуванням — NUM_LEARN_MODE нижче; для швидкої перевірки
   без правки коду додай до адреси застосунку ?learn=direct або ?learn=popup. */
var NUM_LEARN_URL  = 'https://secure.wayforpay.com/payment/httpstmetqUBsy6sRY43ZDRi';
var NUM_LEARN_MODE = 'popup';

function numLearnMode(){
  var m = null;
  try{ m = new URLSearchParams(window.location.search).get('learn'); }catch(e){}
  return (m === 'direct' || m === 'popup') ? m : NUM_LEARN_MODE;
}

function numLearnGo(){
  if(tg && tg.openLink) tg.openLink(NUM_LEARN_URL);
  else                  window.open(NUM_LEARN_URL, '_blank');
}

function numLearnOpen(){
  if(numLearnMode() === 'direct'){ numLearnGo(); return; }
  var ul = document.getElementById('learn-list');
  if(ul){
    /* Список лежить в i18n одним рядком через «|» — так його переклад не
       розсипається на п'ять окремих ключів. Українська лишається в розмітці. */
    var raw = t('num_learn_pop_what', '');
    if(raw) ul.innerHTML = raw.split('|').map(function(x){
      return '<li>' + escHtml(x.replace(/^\u2022\s*/, '')) + '</li>';
    }).join('');
  }
  var m = document.getElementById('learn-modal');
  if(m) m.classList.add('open');
}

function numLearnClose(){
  var m = document.getElementById('learn-modal');
  if(m) m.classList.remove('open');
}

/* Запис на консультацію. ?text= лише ПІДСТАВЛЯЄ чернетку в поле вводу —
   надсилає повідомлення сама людина; параметр офіційно документований для
   публічних юзернеймів (core.telegram.org/api/links).
   Три спроби відкриття: у Telegram-клієнті посилання на t.me має йти через
   openTelegramLink (інакше воно відкриється у вбудованому браузері й чат не
   з'явиться), у вебі його немає, а поза Telegram немає й tg. */
function numConsultOpen(){
  consultOpen(t('num_consult_msg',
    'Вітаю! Мене зацікавила особиста консультація з розбору Матриці. Підкажіть, будь ласка, як можна записатися?'));
}

/* Відкрити чат з Аліною з уже набраною чернеткою msg. Одна функція на
   Матрицю й екран автора — різниться лише текст чернетки. */
function consultOpen(msg){
  var url = 'https://t.me/' + NUM_CONSULT_USER + '?text=' + encodeURIComponent(msg);
  if(tg && tg.openTelegramLink)  tg.openTelegramLink(url);
  else if(tg && tg.openLink)     tg.openLink(url);
  else                           window.open(url, '_blank');
}


/* Легка вібрація на дотик (Telegram HapticFeedback). Поза Telegram, у старих
   клієнтах і за вимкненої вібрації метод просто відсутній — тоді нічого. */
function hapticTap(){
  try{
    if(tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred('light');
  }catch(e){}
}

/* Плитка «Покращити мій блог» на головній веде на екран з бізнес-модулями. */
/* Власна іконка Матриці долі: вісімка вузлів на колі (два квадрати, що
   утворюють восьмикутну зірку), внутрішнє коло, спиці й чотирипроменева іскра
   в центрі. Градієнтна лінія в userSpaceOnUse — інакше горизонтальні лінії
   (нульова висота bbox) зникли б. Зовнішнє точкове кільце повільно обертається,
   іскра мерехтить (див. .mx-* у style.css). */
var MATRIX_ICO =
  '<svg class="mx-ico" viewBox="0 0 120 120" fill="none" aria-hidden="true">'
  +'<defs>'
  +'<linearGradient id="mxg" gradientUnits="userSpaceOnUse" x1="8" y1="8" x2="112" y2="112">'
  +'<stop offset="0" stop-color="#FBE9B0"/><stop offset="1" stop-color="#C9983F"/></linearGradient>'
  +'<radialGradient id="mxglow"><stop offset="0" stop-color="#F0CE7A" stop-opacity=".6"/>'
  +'<stop offset="1" stop-color="#F0CE7A" stop-opacity="0"/></radialGradient>'
  +'</defs>'
  +'<circle class="mx-glow" cx="60" cy="60" r="38" fill="url(#mxglow)"/>'
  +'<circle class="mx-orbit" cx="60" cy="60" r="57" stroke="url(#mxg)" stroke-width="1.9" stroke-linecap="round" stroke-dasharray="0.1 6" opacity=".7"/>'
  +'<circle cx="60" cy="60" r="52" stroke="url(#mxg)" stroke-width="1.7" opacity=".85"/>'
  +'<circle cx="60" cy="60" r="36" stroke="url(#mxg)" stroke-width="1.2" stroke-dasharray="2 3" opacity=".5"/>'
  +'<path d="M60 8L112 60L60 112L8 60Z" stroke="url(#mxg)" stroke-width="1.9" stroke-linejoin="round"/>'
  +'<path d="M23.2 23.2H96.8V96.8H23.2Z" stroke="url(#mxg)" stroke-width="1.5" stroke-linejoin="round" opacity=".75"/>'
  +'<path d="M60 8V112M8 60H112" stroke="url(#mxg)" stroke-width="1.1" opacity=".45"/>'
  +'<path d="M23.2 23.2L96.8 96.8M96.8 23.2L23.2 96.8" stroke="url(#mxg)" stroke-width="1.1" opacity=".35"/>'
  +'<path d="M60 38L82 60L60 82L38 60Z" stroke="url(#mxg)" stroke-width="1.4" stroke-linejoin="round" opacity=".7"/>'
  +'<g fill="url(#mxg)">'
  +'<circle cx="60" cy="8" r="3.2"/><circle cx="112" cy="60" r="3.2"/><circle cx="60" cy="112" r="3.2"/><circle cx="8" cy="60" r="3.2"/>'
  +'<circle cx="96.8" cy="23.2" r="2.2"/><circle cx="96.8" cy="96.8" r="2.2"/><circle cx="23.2" cy="96.8" r="2.2"/><circle cx="23.2" cy="23.2" r="2.2"/>'
  +'<circle cx="85.5" cy="34.5" r="1.6"/><circle cx="85.5" cy="85.5" r="1.6"/><circle cx="34.5" cy="85.5" r="1.6"/><circle cx="34.5" cy="34.5" r="1.6"/>'
  +'</g>'
  +'<path class="mx-star" d="M60 38C62 52 68 58 82 60C68 62 62 68 60 82C58 68 52 62 38 60C52 58 58 52 60 38Z" fill="url(#mxg)"/>'
  +'</svg>';
/* Іконки двох другорядних рядків: срібно-блакитна «розмова» з іскрою й
   фіолетове перо з іскрою. */
var SVC_ICO =
  '<svg class="mr-ico" viewBox="0 0 64 64" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  +'<path d="M15.500 22.500H36a6 6 0 016 6V44a6 6 0 01-6 6H23l-7 7v-7h-.5a6 6 0 01-6-6V28.500a6 6 0 016-6z" stroke="#87A3B5"/>'
  +'<path d="M26 10.500h23.500a6 6 0 016 6V34a6 6 0 01-6 6H49l1 7-9-7H26a6 6 0 01-6-6V16.500a6 6 0 016-6z" stroke="#BCD2E1" fill="#14161B"/>'
  +'<path class="mr-spark" d="M38 17C38.800 22 41 24.200 46 25C41 25.800 38.800 28 38 33C37.200 28 35 25.800 30 25C35 24.200 37.200 22 38 17Z" fill="#E8C070" stroke="none"/>'
  +'</svg>';
var BLOG_ICO =
  '<svg class="mr-ico" viewBox="0 0 64 64" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  +'<path d="M53 8C37 9 22 19 17 33c-1.500 4-1.500 9 0 13 12-1 27-9 32-21 3-6 4-12 4-17z" stroke="#C3A9DD" stroke-width="2"/>'
  +'<path d="M16 46L44 18M16 46L10 56" stroke="#C3A9DD" stroke-width="2"/>'
  +'<path d="M26 36c4-4 8-6 12-6" stroke="#C3A9DD" stroke-width="1.500" opacity=".7"/>'
  +'<path class="mr-spark" d="M47 44C47.800 49 50 51.200 55 52C50 52.800 47.800 55 47 60C46.200 55 44 52.800 39 52C44 51.200 46.200 49 47 44Z" fill="#E8C070" stroke="none"/>'
  +'</svg>';

function bizTileHtml(){
  return '<button class="mc mc-biz" id="m-biz" data-biz="1">'
    +'<span class="mc-corner"><span class="svc-chev" aria-hidden="true">'
    +'<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span></span>'
    +'<span class="mico" aria-hidden="true">'+BLOG_ICO+'</span>'
    +'<span class="mname">'+escHtml(t('biz_tile_name','Мій блог'))+'</span>'
    +'<span class="mdesc">'+escHtml(t('biz_tile_desc','Ідеї для профілю, контенту та позиціонування'))+'</span>'
    +'</button>';
}
function bizOpenList(){ pushScreen('biz-list'); }

/* ─── МОЇ ПОСЛУГИ ──────────────────────────────────────────────────────────
   Перелік форматів роботи з Аліною. Тексти сторінок — від замовниці, дослівно;
   лежать тут як дані, а не в розмітці: шість сторінок однієї будови не варто
   тримати шістьма копіями HTML. Тексти поки лише українською (без перекладу).

   Блоки: ['b', рядок] — жирний підзаголовок сторінки; ['p', текст] — абзац;
   ['h', рядок] — заголовок розділу; ['ul', [пункти]] — список;
   ['sh', жирний рядок, текст] — пункт із власним підзаголовком;
   ['facts', [рядки]] — короткі факти (ціна, доступ).
   cta.kind: 'tg' — чат Аліни з готовою чернеткою msg; 'url' — зовнішнє
   посилання (форма, оплата). */
var SERVICES = [
  { id:'forecast', emoji:'🔮', title:'Прогностика на 2027 рік',
    blocks:[
      ['b','ТВІЙ 2027 РІК. ДО ЧОГО ВАРТО БУТИ ГОТОВОЮ?'],
      ['p','А ти вже замислювалась, яким для тебе буде наступний рік?'],
      ['p','Чому в одні періоди все складається легко, з’являються нові можливості, люди, гроші, а в інші доводиться докладати набагато більше зусиль навіть до звичних речей?'],
      ['p','За допомогою нумерологічної прогностики ми можемо дослідити тенденції твого особистого року та зрозуміти, на які сфери життя варто звернути особливу увагу.'],
      ['h','✨ Що ти дізнаєшся?'],
      ['ul',[
        'Які основні теми та життєві завдання можуть вийти на перший план у 2027 році.',
        'Які періоди будуть сприятливими для нових починань, змін та розвитку.',
        'На що звернути увагу у фінансах, кар’єрі та самореалізації.',
        'Які питання можуть стати актуальними у стосунках та особистому житті.',
        'Як краще розподіляти свої ресурси та планувати важливі рішення.',
        'Які внутрішні зміни та можливості для особистого зростання може принести цей рік.']],
      ['p','Прогностика — це не готовий сценарій, за яким ти зобов’язана жити. Це можливість подивитися на свій рік ширше, усвідомленіше приймати рішення та краще розуміти себе.'],
      ['p','👇 Хочеш отримати свою особисту прогностику на 2027 рік?']],
    cta:{ label:'Подати заявку на прогностику', kind:'tg',
          msg:'Вітаю! Хочу подати заявку на прогностику на 2027 рік. Підкажіть, будь ласка, як це зробити?' } },

  { id:'club', emoji:'💜', title:'Закритий клуб',
    blocks:[
      ['b','ЗАКРИТИЙ КЛУБ — ТВОЄ МІСЦЕ СИЛИ, РОЗВИТКУ ТА ПІДТРИМКИ'],
      ['p','Уяви простір, де ти можеш регулярно отримувати відповіді на свої запитання, краще розуміти себе, розбирати складні життєві ситуації та бути серед жінок, які також хочуть змінювати своє життя.'],
      ['p','Без необхідності щоразу купувати окремі консультації чи навчальні програми.'],
      ['p','Я створюю закритий клуб для жінок, які хочуть не просто читати прогнози, а навчитися краще розуміти себе, свої реакції, стосунки, гроші та можливості.'],
      ['h','✨ ЩО ТЕБЕ ЧЕКАЄ ВСЕРЕДИНІ?'],
      ['sh','🎥 Прямі ефіри зі мною','Будемо регулярно зустрічатися та розбирати теми, які справді впливають на твоє життя.'],
      ['sh','🔮 Прогнози та розбір важливих періодів','Що відбувається зараз? На що звернути увагу? Чому можуть повертатися старі ситуації, загострюватися конфлікти або з’являтися бажання все змінити?'],
      ['sh','💎 Особисті розбори та відповіді на запитання','Розбиратимемо реальні ситуації та запити учасниць клубу. Стосунки, гроші, робота, страхи, внутрішні конфлікти та складні рішення.'],
      ['sh','🧠 Психологія та самопізнання','Чому ти повторюєш одні й ті самі сценарії? Звідки беруться страхи, невпевненість, залежність від чужої думки та постійне бажання все контролювати?'],
      ['sh','💰 Гроші, реалізація та особистий розвиток','Будемо говорити про фінансові установки, самоцінність, страх проявлятися, заробляти більше та дозволяти собі інший рівень життя.'],
      ['sh','❤️ Стосунки та особисті кордони','Як перестати тягнути все на собі? Навчитися говорити про свої бажання, будувати здорові стосунки та не втрачати себе поруч з іншими.'],
      ['sh','✨ Живе спілкування та підтримка','Можливість ставити запитання, ділитися своїми ситуаціями та отримувати нові погляди й інструменти для змін.'],
      ['h','Цей клуб для тебе, якщо:'],
      ['ul',[
        'Ти відчуваєш, що хочеш змін, але не знаєш, із чого почати.',
        'Тобі цікаві психологія, нумерологія та самопізнання.',
        'Ти хочеш регулярно отримувати нові знання та практичні інструменти.',
        'Тобі важливо мати середовище, у якому можна бути собою.',
        'Ти хочеш поступово працювати над собою, а не чекати чергової життєвої кризи.']],
      ['h','💜 ФОРМАТ УЧАСТІ'],
      ['p','Закритий клуб із щомісячною підпискою.'],
      ['p','Ти оплачуєш один місяць участі та отримуєш доступ до активностей клубу.'],
      ['p','Хочеш дізнатися вартість та умови вступу?']],
    cta:{ label:'Подати заявку на вступ та дізнатися вартість', kind:'tg',
          msg:'Вітаю! Хочу подати заявку на вступ у закритий клуб та дізнатися вартість участі.' } },

  { id:'school', emoji:'🎓', title:'Школа «Нумеролог як професія»',
    blocks:[
      ['b','НУМЕРОЛОГ ЯК ПРОФЕСІЯ'],
      ['b','НОВИЙ ПОТІК — ЛЮТИЙ 2027 РОКУ'],
      ['p','А що, як твоє захоплення нумерологією може перерости в нову професію?'],
      ['p','Ти можеш не просто навчитися розраховувати матрицю, а отримати знання, за допомогою яких зможеш проводити повноцінні консультації, допомагати іншим людям та створити власну практику.'],
      ['p','Я відкриваю передзапис на новий потік навчальної програми «Нумеролог як професія».'],
      ['h','✨ ЧОГО ТИ НАВЧИШСЯ?'],
      ['ul',[
        'Самостійно розраховувати та професійно розбирати матрицю долі.',
        'Розуміти значення 22 арканів та їхні прояви в житті людини.',
        'Аналізувати таланти, здібності, фінансову реалізацію та призначення.',
        'Розбирати стосунки, сумісність, родові сценарії та життєві завдання.',
        'Проводити консультації за різними запитами клієнтів.',
        'Працювати з прогностикою та іншими інструментами нумерологічного аналізу.',
        'Правильно будувати консультацію, спілкуватися з клієнтами та презентувати свої послуги.',
        'Просувати себе як спеціаліста та залучати перших клієнтів.']],
      ['h','💎 КОМУ ПІДІЙДЕ НАВЧАННЯ?'],
      ['ul',[
        'Тим, хто починає з нуля та хоче отримати системні знання.',
        'Тим, хто вже цікавиться нумерологією, але хоче перейти на професійний рівень.',
        'Тим, хто шукає новий напрям реалізації та можливість заробляти на власних знаннях.',
        'Тим, хто хоче отримати додатковий спосіб заробітку.']],
      ['p','Старт нового потоку — лютий 2027 року.'],
      ['p','Зараз ти можеш заповнити анкету передзапису та отримати інформацію про програму навчання й умови участі.']],
    cta:{ label:'Заповнити анкету передзапису', kind:'url', url:'https://forms.gle/hFXKdkYkvfN6QLyK7' } },

  { id:'mentoring', emoji:'💎', title:'Особисте наставництво',
    blocks:[
      ['b','ОСОБИСТЕ НАСТАВНИЦТВО З АЛІНОЮ ГРИЦАЄНКО'],
      ['p','1 місяць або 2,5 місяці індивідуальної роботи.'],
      ['p','Буває, ти вже все розумієш головою.'],
      ['p','Знаєш, що потрібно змінити. Бачиш свої помилки. Розумієш, що більше не хочеш жити так, як раніше.'],
      ['p','Але проходить місяць, другий, третій — і ти знову повертаєшся до тих самих проблем.'],
      ['p','Саме для таких ситуацій я створила формат особистого наставництва.'],
      ['p','Це індивідуальна робота, у якій ми не обмежуємося одним запитом, а детально розбираємо твою ситуацію та створюємо конкретний план змін.'],
      ['h','✨ З ЧИМ МИ МОЖЕМО ПРАЦЮВАТИ?'],
      ['ul',[
        'Самореалізація, пошук себе та свого напрямку.',
        'Гроші, фінансові установки, страх заробляти більше.',
        'Особистий бренд, проявленість, розвиток власної справи.',
        'Стосунки, особисті кордони та повторювані сценарії.',
        'Самооцінка, невпевненість, страх критики та помилок.',
        'Внутрішні обмеження, прокрастинація та самосаботаж.',
        'Особисті цілі, стратегія розвитку та реалізація задуманого.',
        'Розвиток соціальних мереж для нумерологів, астрологів, психологів, езотериків.']],
      ['h','💫 ДВА ФОРМАТИ РОБОТИ'],
      ['sh','1 місяць — інтенсивна індивідуальна робота.','Підійде, якщо в тебе є конкретний запит, з яким ти хочеш попрацювати, зрозуміти причини труднощів та визначити наступні кроки.'],
      ['sh','2,5 місяці — глибока системна робота.','Для тих, хто хоче попрацювати одразу з декількома сферами життя, змінити звичні сценарії, вибудувати нову стратегію та поступово впроваджувати зміни.'],
      ['p','У своїй роботі я поєдную психологію, коучинг, нумерологію та практичні інструменти особистого розвитку.'],
      ['p','Я не даю універсальних порад. Ми працюємо з твоїм життям, твоїми цілями та твоїми можливостями.'],
      ['h','💛 ЯК ПОТРАПИТИ В НАСТАВНИЦТВО?'],
      ['p','Перший крок — безкоштовний ознайомчий зідзвон.'],
      ['p','Ми познайомимося, обговоримо твій запит, визначимо, чи підходить тобі цей формат, та оберемо оптимальну тривалість роботи.']],
    cta:{ label:'Записатися на безкоштовний зідзвон', kind:'tg',
          msg:'Вітаю! Хочу записатися на безкоштовний зідзвон про особисте наставництво. Підкажіть, будь ласка, як це зробити?' } },

  { id:'consult', emoji:'✨', title:'Особиста консультація',
    blocks:[
      ['b','ОСОБИСТА КОНСУЛЬТАЦІЯ З АЛІНОЮ ГРИЦАЄНКО'],
      ['p','Іноді достатньо однієї глибокої розмови, щоб побачити ситуацію зовсім під іншим кутом.'],
      ['p','Якщо ти зараз стоїш перед складним вибором, не розумієш, куди рухатися далі, постійно повертаєшся до одних і тих самих проблем або хочеш краще зрозуміти себе — запрошую тебе на особисту консультацію.'],
      ['p','У своїй роботі я поєдную психологію, нумерологію та коучингові інструменти.'],
      ['h','🔍 ЩО МИ МОЖЕМО РОЗІБРАТИ?'],
      ['ul',[
        'Питання особистого розвитку та поточних, важливих життєвих рішень.',
        'Професійну реалізацію, гроші та напрям розвитку.',
        'Стосунки, сумісність та особисті сценарії.',
        'Внутрішні конфлікти, страхи й обмеження.',
        'Твої сильні сторони, таланти та можливості.',
        'Складні життєві ситуації та можливі шляхи їх вирішення.',
        'Повторювані помилки та причини, через які ти можеш зупиняти себе.']],
      ['h','💛 ЩО ТИ ОТРИМАЄШ?'],
      ['p','Індивідуальний розбір твого запиту, новий погляд на ситуацію, розуміння можливих причин труднощів та конкретні рекомендації, які зможеш застосувати у своєму житті.'],
      ['p','Якщо ти відчуваєш, що настав час розібратися в собі та своїй ситуації, запрошую тебе на консультацію.']],
    cta:{ label:'Записатися на консультацію та дізнатись умови', kind:'tg',
          msg:'Вітаю! Хочу записатися на особисту консультацію та дізнатися умови. Підкажіть, будь ласка, як це зробити?' } },

  { id:'course', emoji:'📚', title:'Курс «Сам собі нумеролог»',
    blocks:[
      ['b','САМ СОБІ НУМЕРОЛОГ'],
      ['p','Навчись самостійно розраховувати матрицю долі та розуміти значення 22 арканів!'],
      ['p','Тобі цікаво, що означають числа у твоїй матриці? Чому одні якості в тобі проявляються сильніше, а інші складніше розкрити? Які таланти, здібності та можливості ти можеш у собі дослідити?'],
      ['p','Я створила курс «Сам собі нумеролог» для тих, хто хоче самостійно познайомитися з нумерологією, навчитися розраховувати матрицю та розуміти значення її основних енергій.'],
      ['p','Тобі не потрібні попередні знання чи досвід. Усе пояснюю просто, зрозуміло та покроково.'],
      ['h','📚 ЩО ТИ ОТРИМАЄШ?'],
      ['sh','🔸 Покрокові відеоуроки.','Усі заняття вже записані, тому ти можеш навчатися у зручний для себе час.'],
      ['sh','🔸 Розрахунок матриці долі.','Навчишся самостійно розраховувати матрицю та розуміти, звідки беруться числа.'],
      ['sh','🔸 Значення 22 арканів.','Розбереш основні характеристики кожного аркана, його сильні сторони, можливості та складні прояви.'],
      ['sh','🔸 Глибше розуміння себе.','Зможеш використовувати отримані знання як інструмент самопізнання, досліджувати свої таланти, здібності та особисті якості.'],
      ['sh','🔸 Навчання у власному темпі.','Без прив’язки до розкладу, дедлайнів та обов’язкових зустрічей.'],
      ['h','💫 ЯК ПРОХОДИТЬ НАВЧАННЯ?'],
      ['p','Після оплати ти отримуєш доступ до закритого Telegram-каналу, де вже розміщені всі відеоуроки та навчальні матеріали.'],
      ['p','Можеш переглядати уроки стільки разів, скільки потрібно, повертатися до інформації та навчатися у своєму темпі.'],
      ['h','💛 ДЛЯ КОГО ЦЕЙ КУРС?'],
      ['ul',[
        'Для тих, хто тільки знайомиться з нумерологією.',
        'Для тих, хто хоче самостійно розраховувати свою матрицю.',
        'Для тих, хто цікавиться самопізнанням та особистим розвитком.',
        'Для тих, хто хоче вивчити значення всіх 22 арканів.',
        'Для тих, хто поки не планує ставати професійним нумерологом, але хоче отримати базові знання для себе.']],
      ['facts',['💰 ВАРТІСТЬ: 2 999 грн','🔓 ДОСТУП: НАЗАВЖДИ','🎥 ФОРМАТ: Відеоуроки в записі у закритому Telegram-каналі.']],
      ['p','Ти оплачуєш курс один раз і можеш повертатися до матеріалів у будь-який зручний час.']],
    cta:{ label:'Придбати курс — 2 999 грн', kind:'url', url:'https://secure.wayforpay.com/payment/httpstmetqUBsy6sRY43ZDRi' } }
];

var SVC_CUR = null;

function svcById(id){
  for(var i = 0; i < SERVICES.length; i++) if(SERVICES[i].id === id) return SERVICES[i];
  return null;
}

/* Плитка на головній. Окрема від модулів: у неї немає ні доступу, ні квоти. */
function svcTileHtml(){
  return '<button class="mc mc-svc" id="m-services" data-svc="1">'
    +'<span class="mc-corner"><span class="svc-chev" aria-hidden="true">'
    +'<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span></span>'
    +'<span class="mico" aria-hidden="true">'+SVC_ICO+'</span>'
    +'<span class="mname">'+escHtml(t('svc_tile_name','Мої послуги'))+'</span>'
    +'<span class="mdesc">'+escHtml(t('svc_tile_desc','Консультації, навчання та підтримка'))+'</span>'
    +'</button>';
}

function svcRenderItems(){
  var box = document.getElementById('svc-items');
  if(box){
    box.innerHTML = SERVICES.map(function(sv, i){
      return '<button class="btn bg svc-item" style="--i:'+i+'" data-svc="'+escHtml(sv.id)+'">'
        +'<span class="svc-emo" aria-hidden="true">'+escHtml(sv.emoji)+'</span>'
        +'<span class="svc-item-t">'+escHtml(sv.title)+'</span>'
        +'<span class="svc-chev" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span>'
        +'</button>';
    }).join('');
  }
}
function svcOpenList(){ pushScreen('svc-list'); }

function svcOpenDetail(id){
  var sv = svcById(id);
  if(!sv) return;
  SVC_CUR = sv;
  var title = document.getElementById('svc-detail-title');
  if(title) title.textContent = sv.emoji+' '+sv.title;
  var h = '';
  sv.blocks.forEach(function(b){
    var k = b[0];
    if(k === 'b')          h += '<div class="svc-b">'+escHtml(b[1])+'</div>';
    else if(k === 'p')     h += '<p class="num-para">'+escHtml(b[1])+'</p>';
    else if(k === 'h')     h += '<div class="num-sect svc-h">'+escHtml(b[1])+'</div>';
    else if(k === 'ul')    h += '<ul class="learn-list">'+b[1].map(function(x){ return '<li>'+escHtml(x)+'</li>'; }).join('')+'</ul>';
    else if(k === 'sh')    h += '<div class="svc-sh"><div class="svc-shh">'+escHtml(b[1])+'</div><p class="num-para">'+escHtml(b[2])+'</p></div>';
    else if(k === 'facts') h += '<div class="learn-facts">'+b[1].map(function(x){ return '<div>'+escHtml(x)+'</div>'; }).join('')+'</div>';
  });
  var body = document.getElementById('svc-body');
  if(body) body.innerHTML = '<div class="num-panel num-stack svc-panel">'+h+'</div>';
  var cta = document.getElementById('svc-cta');
  if(cta) cta.textContent = sv.cta.label;
  pushScreen('svc-detail');
  window.scrollTo(0, 0);
}

function svcCtaGo(){
  var sv = SVC_CUR;
  if(!sv) return;
  if(sv.cta.kind === 'tg'){ consultOpen(sv.cta.msg); return; }
  if(tg && tg.openLink) tg.openLink(sv.cta.url);
  else                  window.open(sv.cta.url, '_blank');
}


/* ─── 7. КАРТА ЗДОРОВ'Я ────────────────────────────────────────────────── */

function numRenderHealth(){
  var box = document.getElementById('num-health-body');
  var m   = NUM.active;
  if(!box || !m) return;

  var sub = document.getElementById('num-health-sub');
  if(sub){
    var hm = (NUM.hints && NUM.hints.blocks && NUM.hints.blocks.health) || {};
    sub.textContent = hm.hint || numSchemeSub();
  }

  var hd = m.health;
  /* Таблиця загорнута в .num-panel: досі це був єдиний блок модуля без панелі,
     і екран здоров'я через це виглядав чужим серед решти шести. */
  /* Застереження методички здоров'я й підказка про натискні числа живуть
     ТУТ, а не лише у шторці: людина має побачити «це не діагноз» до того, як
     відкриє перше тлумачення, а не після. */
  var h = '<div id="num-health-note"></div>';
  h += '<div class="num-panel"><table class="num-htable">';
  h += '<thead><tr>' +
         '<th>' + escHtml(t('num_health_chakra','Чакра'))     + '</th>' +
         '<th>' + escHtml(t('num_health_physics','Фізика'))   + '</th>' +
         '<th>' + escHtml(t('num_health_energy','Енергія'))   + '</th>' +
         '<th>' + escHtml(t('num_health_emotions','Емоції'))  + '</th>' +
       '</tr></thead><tbody>';

  hd.rows.forEach(function(r){
    h += '<tr>';
    h +=   '<td><span class="num-hname">' +
             '<span class="num-hdot" style="background:' + escHtml(r.color) + '"></span>' +
             escHtml(r.title) + '</span></td>';
    h +=   '<td class="num-hnum">' + numTapNum('health', r.physics,
             r.title + ' · ' + t('num_health_physics','Фізика'))  + '</td>';
    h +=   '<td class="num-hnum">' + numTapNum('health', r.energy,
             r.title + ' · ' + t('num_health_energy','Енергія'))  + '</td>';
    h +=   '<td class="num-hnum">' + numTapNum('health', r.emotions,
             r.title + ' · ' + t('num_health_emotions','Емоції')) + '</td>';
    h += '</tr>';
  });

  h += '<tr class="num-hsum">' +
         '<td>' + escHtml(t('num_health_sum','Сума')) + '</td>' +
         '<td class="num-hnum">' + escHtml(String(hd.sum.physics))  + '</td>' +
         '<td class="num-hnum">' + escHtml(String(hd.sum.energy))   + '</td>' +
         '<td class="num-hnum">' + escHtml(String(hd.sum.emotions)) + '</td>' +
       '</tr>';
  h += '<tr class="num-htotal">' +
         '<td>' + escHtml(t('num_health_total','Підсумок')) + '</td>' +
         '<td class="num-hnum">' + numTapNum('health', hd.total.physics,
           t('num_health_total','Підсумок') + ' · ' + t('num_health_physics','Фізика'))  + '</td>' +
         '<td class="num-hnum">' + numTapNum('health', hd.total.energy,
           t('num_health_total','Підсумок') + ' · ' + t('num_health_energy','Енергія'))  + '</td>' +
         '<td class="num-hnum">' + numTapNum('health', hd.total.emotions,
           t('num_health_total','Підсумок') + ' · ' + t('num_health_emotions','Емоції')) + '</td>' +
       '</tr>';
  h += '</tbody></table></div>';

  box.innerHTML = h;
  numBindBlockButtons(box);
  numLangNote('num-health-body');

  /* Один запит на весь екран. Числа таблиці повторюються (9 і 18 тут по
     кілька разів), block_texts їх схлопує, тож 21 комірка коштує стільки ж,
     скільки унікальних арканів у ній є. */
  numFillBlockNote('health', numHealthEnergies(hd), 'num-health-note');
}

/* Усі арканні числа екрана здоров'я: сім чакр × три колонки плюс підсумок.
   Рядок «Сума» не входить — його значення (82, 71, 99) не аркани. */
function numHealthEnergies(hd){
  var out = [];
  hd.rows.forEach(function(r){ out.push(r.physics, r.energy, r.emotions); });
  out.push(hd.total.physics, hd.total.energy, hd.total.emotions);
  return out.filter(function(v){ return v >= 1 && v <= 22; });
}

/* Тягне тексти блоку заради ЗАСТЕРЕЖЕННЯ і заодно прогріває кеш, щоб перше
   натискання на число відкрилось без мережі. Помилку тут навмисно не
   показуємо: екран уже намальований і працює, а застереження дублюється у
   шторці — там же, де й текст, показ якого воно обмежує. */
function numFillBlockNote(blockId, nums, hostId){
  numLoadBlockTexts(blockId, nums, function(errMsg){
    var host = document.getElementById(hostId);
    if(!host || errMsg) return;
    var note = numBlockNoteHtml(blockId);
    host.innerHTML = note +
      '<div class="num-hint num-tap-hint">' +
        escHtml(t('num_block_tap','Натисни на число, щоб побачити, що воно означає тут.')) +
      '</div>';
  });
}


/* ─── 8. ПРОГНОСТИКА ───────────────────────────────────────────────────── */

/* Контур приходить пласким списком із 65 вузлів: ID опорного — це вік
   («40»), ID проміжного — «40_6-7». Групуємо по десятиліттях тут, а не на
   сервері: сервер віддає канонічну послідовність, а розкладка по картках —
   рішення екрана, і на іншому екрані вона може бути іншою. */
function numRenderProg(){
  var box = document.getElementById('num-prog-body');
  var m   = NUM.active;
  if(!box || !m) return;

  var sub = document.getElementById('num-prog-sub');
  if(sub){
    var am = (NUM.hints && NUM.hints.blocks && NUM.hints.blocks.ageContour) || {};
    sub.textContent = am.hint || numSchemeSub();
  }

  var groups   = [];
  var byDecade = {};
  m.ageContour.forEach(function(node){
    var dec = node.id.split('_')[0];
    if(!byDecade[dec]){ byDecade[dec] = { age:dec, anchor:null, nodes:[] }; groups.push(byDecade[dec]); }
    if(node.id.indexOf('_') < 0) byDecade[dec].anchor = node;
    else                         byDecade[dec].nodes.push(node);
  });

  var h = '<div id="num-prog-note"></div>';
  groups.forEach(function(g){
    var anchorPt = (g.anchor && g.anchor.pointId) ? numPointLabel(g.anchor.pointId) : '—';
    h += '<div class="num-panel num-stack">';
    h +=   '<div class="num-decade-hd">';
    h +=     '<span class="num-decade-age">' + escHtml(g.age) + '</span>';
    h +=     '<span class="num-decade-lbl">' +
               escHtml(fmt(t('num_decade','років · опорна точка {p}'), { p: anchorPt })) +
             '</span>';
    h +=   '</div>';
    h +=   '<div class="num-nodes">';
    /* Підпис у шторці — сам вік: підпис вузла ним і є («5», «16-17»).
       Без нього тлумачення читалось би як позачасове, а методичка
       прогностики описує саме ПЕРІОД («можлива тема періоду»). Десятиліття
       в підпис не додаємо: воно вже є у підписі вузла, і «10 років · 16-17»
       читалось би як два різні віки. */
    function node(n){
      var sub = fmt(t('num_prog_node','{l} років'), { l:n.label });
      return '<div class="num-node">' +
               '<div class="num-node-lbl">' + escHtml(n.label) + '</div>' +
               '<div class="num-node-v">' + numTapNum('prognosis', n.value, sub) + '</div>' +
             '</div>';
    }
    if(g.anchor) h += node(g.anchor);
    g.nodes.forEach(function(n){ h += node(n); });
    h +=   '</div>';
    h += '</div>';
  });

  box.innerHTML = h;
  numBindBlockButtons(box);
  numLangNote('num-prog-body');

  numFillBlockNote('prognosis',
    m.ageContour.map(function(n){ return n.value; }), 'num-prog-note');
}


/* ─── 9. ДОВІДНИК 22 ЕНЕРГІЙ ───────────────────────────────────────────── */

function numRenderEnergies(){
  var box = document.getElementById('num-egrid');
  if(!box) return;
  var titles = NUM.energyTitles || {};
  var h = '';
  for(var n = 1; n <= 22; n++){
    h += '<button class="num-ecell" data-energy="' + n + '">' +
           '<span class="num-ecell-n">' + n + '</span>' +
           '<span class="num-ecell-t">' + escHtml(titles[String(n)] || '') + '</span>' +
         '</button>';
  }
  box.innerHTML = h;
  box.querySelectorAll('.num-ecell').forEach(function(b){
    b.addEventListener('click', function(){ numOpenEnergy(parseInt(b.dataset.energy, 10)); });
  });
  numLangNote('num-egrid');
}


/* ─── 10. СУМІСНІСТЬ ───────────────────────────────────────────────────── */

function numRenderCompatForm(){
  var box = document.getElementById('num-compat-form');
  if(!box) return;

  var mine = S.profile.birthdate || '';
  var h = '';
  h += '<div class="igrp">';
  h +=   '<label class="ilbl" for="num-c-self">' + escHtml(t('num_compat_self','Твоя дата народження')) + '</label>';
  h +=   '<input class="inp" id="num-c-self" type="text" inputmode="numeric" placeholder="29.07.1989" maxlength="10" value="' + escHtml(mine) + '">';
  h +=   '<div class="ierr" id="num-c-self-err"></div>';
  h += '</div>';
  h += '<div class="igrp">';
  h +=   '<label class="ilbl" for="num-c-partner">' + escHtml(t('num_compat_partner','Дата народження другої людини')) + '</label>';
  h +=   '<input class="inp" id="num-c-partner" type="text" inputmode="numeric" placeholder="04.06.1990" maxlength="10">';
  h +=   '<div class="ierr" id="num-c-partner-err"></div>';
  h += '</div>';
  /* Обіцянка, яку тримає сервер: партнерська дата не пишеться в БД і не
     потрапляє в історію розборів. Користувач має бачити це ДО вводу. */
  h += '<div class="num-panel num-panel-q num-legal">' + escHtml(t('num_compat_privacy',
       'Дата народження другої людини використовується лише для цього розрахунку. Вона не зберігається і не потрапляє в історію.')) + '</div>';
  h += '<button class="btn bp" id="num-c-go">' + escHtml(t('num_compat_go','Розрахувати сумісність')) + '</button>';

  box.innerHTML = h;

  numMaskDate(document.getElementById('num-c-self'));
  var pIn = document.getElementById('num-c-partner');
  numMaskDate(pIn);
  pIn.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); numCompatGo(); } });
  document.getElementById('num-c-go').addEventListener('click', numCompatGo);
}

function numCompatGo(){
  var selfV    = document.getElementById('num-c-self').value.trim();
  var partnerV = document.getElementById('num-c-partner').value.trim();
  numInlineErr('num-c-self-err', '');
  numInlineErr('num-c-partner-err', '');

  if(!partnerV){
    numInlineErr('num-c-partner-err', t('err_birth_required','Вкажи дату народження'));
    return;
  }

  var btn   = document.getElementById('num-c-go');
  var label = btn.textContent;
  btn.disabled = true;
  btn.textContent = t('num_calculating','Рахуємо...');

  apiFetch('/api/numerology/compatibility', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ birthdate: selfV, partner_birthdate: partnerV })
  }).then(function(data){
    btn.disabled = false; btn.textContent = label;
    if(!data.ok){
      /* Префікс partner_ у коді — єдиний спосіб зрозуміти, ПІД ЯКИМ полем
         показати відмову: тексти обох полів однакові, і гілкуватись по
         копірайту тут означало б повернути ту саму ваду, що прибрав код. */
      var isPartner = typeof data.code === 'string' && data.code.indexOf('partner_') === 0;
      var d = numErrData(data);
      var msg = serverErrText(d, 'num_err_compat', 'Не вдалось порахувати сумісність');
      numInlineErr(isPartner ? 'num-c-partner-err' : 'num-c-self-err', msg);
      return;
    }
    NUM.active           = data.pair;
    NUM.mode             = 'pair';
    NUM.birthdate        = data.birthdate;
    NUM.partnerBirthdate = data.partnerBirthdate;
    NUM.hints            = data.hints;
    NUM.energyTitles     = data.energyTitles;
    NUM.contentLang      = data.contentLang;
    if(data.karmicTail) NUM.tailCache[String(data.pair.karmicTail)] = data.karmicTail;

    numRenderAll();
    numRenderCompatResult();
    pushScreen('num-scheme');
  }).catch(function(){
    btn.disabled = false; btn.textContent = label;
    showErrToast(t('err_network','Помилка мережі'));
  });
}

/* Ехо результату на екрані форми. Без нього повернення «назад» зі схеми
   пари приводить на порожню форму, ніби розрахунку не було. */
function numRenderCompatResult(){
  var box = document.getElementById('num-compat-body');
  if(!box) return;
  var h = '';
  h += '<div class="num-panel num-stack">';
  h +=   '<div class="num-card-title">' + escHtml(t('num_compat_result','Матриця пари готова')) + '</div>';
  h +=   '<div class="num-card-pts">' + escHtml((NUM.birthdate || '—') + ' + ' + (NUM.partnerBirthdate || '—')) + '</div>';
  h +=   '<button class="btn bg bsm" id="num-c-open">' + escHtml(t('num_compat_open','Відкрити схему пари')) + '</button>';
  h += '</div>';
  box.innerHTML = h;
  document.getElementById('num-c-open').addEventListener('click', function(){
    pushScreen('num-scheme');
  });
}


/* ─── BIND EVENTS ─── */

function copyResult(btn){
  var resp = btn.closest('.airesp');
  if(!resp) return;
  var txt = resp.querySelector('.aitxt');
  if(!txt) return;
  var text = (txt.innerText || txt.textContent || '').trim();
  if(!text) return;

  var ICON_COPY = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
  var ICON_OK   = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

  function markCopied(){
    btn.classList.add('copied');
    btn.innerHTML = ICON_OK + ' ' + escHtml(t('copy_done','Скопійовано!'));
    showToast(t('copy_toast','Результат скопійовано'));
    setTimeout(function(){
      btn.classList.remove('copied');
      btn.innerHTML = ICON_COPY + ' ' + escHtml(t('copy_btn','Копіювати результат'));
    }, 2500);
  }

  function fallbackCopy(){
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      markCopied();
    } catch(e){
      showErrToast(t('copy_failed','Не вдалось скопіювати'));
    }
    document.body.removeChild(ta);
  }

  /* Telegram WebApp має власний метод копіювання */
  if(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.writeTextToClipboard){
    window.Telegram.WebApp.writeTextToClipboard(text, function(success){
      if(success){ markCopied(); } else { fallbackCopy(); }
    });
    return;
  }

  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(markCopied).catch(fallbackCopy);
  } else {
    fallbackCopy();
  }
}

document.addEventListener('DOMContentLoaded', function(){
  /* Розмітка з реєстрів — має відпрацювати ДО будь-якого getElementById,
     що шукає елементи всередині цих контейнерів. */
  renderModuleGrid();
  renderAuthorStats();
  renderTariffCards();
  renderTariffRows();
  renderTariffIncludes();

  // Екран «спершу познайомимось у боті»
  var btnObBot = document.getElementById('btn-ob-bot');
  if(btnObBot){
    setVis(btnObBot, !!(tg && typeof tg.close === 'function'));
    btnObBot.addEventListener('click', backToBot);
  }
  // ── Головна ───────────────────────────────────────────────
  /* Обидві кнопки ведуть у ту саму єдину точку входу. */
  var btnExpand = document.getElementById('btn-expand');
  if(btnExpand) btnExpand.addEventListener('click', function(){ requestAccess('browse'); });

  // ── Модулі (делеговано: .mgrid рендериться з MODULES) ─────
  var mgrid = document.getElementById('mgrid');
  function gridClick(e){
    var card = e.target.closest('.mc');
    if(!card) return;
    hapticTap();
    if(card.dataset.svc){ svcOpenList(); return; }
    if(card.dataset.biz){ bizOpenList(); return; }
    if(card.dataset.mod) handleModClick(card.dataset.mod);
  }
  if(mgrid) mgrid.addEventListener('click', gridClick);
  var bizGridEl = document.getElementById('biz-grid');
  if(bizGridEl) bizGridEl.addEventListener('click', gridClick);

  // ── Тарифи: картка = вибір періоду + той самий шит ────────
  /* Делеговано, як і сітка модулів: картки тепер рендеряться з TARIFFS і
     перемальовуються при зміні мови, тож слухач, повішений на конкретний
     вузол, помер би разом із ним — мовчки, після першого перемикання мови. */
  var openBlog = document.getElementById('btn-open-blog');
  if(openBlog) openBlog.addEventListener('click', bizOpenList);
  var pickBtn = document.getElementById('btn-pick-plan');
  if(pickBtn) pickBtn.addEventListener('click', function(){
    hapticTap();
    var plans = document.getElementById('tar-plans');
    if(plans){
      plans.hidden = false;
      pickBtn.hidden = true;
      try{ plans.scrollIntoView({behavior:'smooth', block:'start'}); }catch(e){}
    }
  });
  var tcards = document.getElementById('tcards');
  if(tcards) tcards.addEventListener('click', function(e){
    var card = e.target.closest('.tcard');
    if(!card || !card.dataset.plan) return;
    var tf = tariffByPlan(card.dataset.plan);
    if(!tf) return;
    selectTariff(tf.plan);
    requestAccess('browse');
  });

  // ── Профіль ───────────────────────────────────────────────
  document.getElementById('btn-renew').addEventListener('click', function(){ requestAccess('browse'); });

  /* «Продовжити доступ» — активна лише коли лишився ≤1 день або вичерпані ліміти */
  var btnRenew2 = document.getElementById('btn-renew2');
  if(btnRenew2) btnRenew2.addEventListener('click', function(){
    if(!this.disabled) requestAccess('renew');
  });

  var btnSD = document.getElementById('btn-my-strategies-demo');
  if(btnSD) btnSD.addEventListener('click', function(){ openMyStrategies(); });
  var btnSA = document.getElementById('btn-my-strategies-active');
  if(btnSA) btnSA.addEventListener('click', function(){ openMyStrategies(); });

  // ── Автор ─────────────────────────────────────────────────
  /* Екран автора: одна кнопка — «Мої послуги» (перелік форматів роботи). */
  /* Профіль сховано під аватарку на головній: окремої вкладки в меню немає. */
  var hmAv = document.getElementById('hm-av');
  var hmRing = hmAv && hmAv.parentNode;
  if(hmRing){
    hmRing.classList.add('avring-btn');
    hmRing.setAttribute('role','button');
    hmRing.addEventListener('click', function(){ hapticTap(); pushScreen('prof'); });
  }
  var autProducts = document.getElementById('btn-aut-products');
  if(autProducts) autProducts.addEventListener('click', svcOpenList);

  // ── Кнопки «назад» на підекранах: усі через стек ──────────
  [['btn-back-mod','home'],
   ['btn-back-mod-access','home'],
   ['btn-back-strategies','prof'],
   ['btn-back-prof','home'],
   ['btn-back-strategy-detail','my-strategies'],
   ['btn-back-followup','home']].forEach(function(pair){
    var el = document.getElementById(pair[0]);
    if(el) el.addEventListener('click', function(){ goBack(pair[1]); });
  });

  // ── Нижня навігація ───────────────────────────────────────
  NAVS.forEach(function(id){
    var el = document.getElementById(NMAP[id]);
    if(el) el.addEventListener('click', function(){ tryShowScreen(id); });
  });

  // ── Шит доступу: вибір періоду ────────────────────────────
  /* Теж делеговано — рядки .tq рендеряться з реєстру (renderTariffRows). */
  var tqs = document.getElementById('tqs');
  if(tqs) tqs.addEventListener('click', function(e){
    var row = e.target.closest('.tq');
    if(!row || !row.dataset.plan) return;
    var tf = tariffByPlan(row.dataset.plan);
    if(tf) selectTariff(tf.plan);
  });

  // ── Шит доступу: кнопки ───────────────────────────────────
  var btnRetry = document.getElementById('btn-pw-retry');
  if(btnRetry) btnRetry.addEventListener('click', function(){ _pwShow('pw-action'); });
  var okBlog = document.getElementById('btn-pw-success-blog');
  if(okBlog) okBlog.addEventListener('click', function(){ closePW(); show('home'); bizOpenList(); });
  ['btn-pw-redirect-close','btn-pw-error-close','btn-pw-success-close','btn-pw-close'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener('click', closePW);
  });
  document.getElementById('btn-pay').addEventListener('click', function(){
    if(!S.registered){ closePW(); show('ob'); return; }
    pay();
  });

  document.getElementById('pw').addEventListener('click', function(e){ if(e.target===this) closePW(); });

  // ── Уточнення ─────────────────────────────────────────────
  var btnSendFu = document.getElementById('followup-send');
  if(btnSendFu) btnSendFu.addEventListener('click', sendFollowup);
  var fuInputEl = document.getElementById('followup-input');
  if(fuInputEl) fuInputEl.addEventListener('keydown', function(e){
    if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendFollowup(); }
  });
  var btnFuBuy = document.getElementById('followup-buy');
  if(btnFuBuy) btnFuBuy.addEventListener('click', function(){ requestAccess('limit_reached'); });

  /* Делегований обробник для copy-btn */
  document.addEventListener('click', function(e){
    var btn = e.target.closest('.copy-btn');
    if(btn) copyResult(btn);
  });

  // Niche modal
  var nmClose = document.getElementById('nm-close-btn');
  if(nmClose) nmClose.addEventListener('click', closeNicheModal);
  var nmSave = document.getElementById('nm-save-btn');
  if(nmSave) nmSave.addEventListener('click', confirmNicheModal);
  var nmOverlay = document.getElementById('niche-modal');
  if(nmOverlay) nmOverlay.addEventListener('click', function(e){ if(e.target===this) closeNicheModal(); });

  // Модалка «Навчитися розраховувати самостійно»
  var lrClose = document.getElementById('learn-close-btn');
  if(lrClose) lrClose.addEventListener('click', numLearnClose);
  var lrPay = document.getElementById('learn-pay-btn');
  if(lrPay) lrPay.addEventListener('click', function(){ numLearnGo(); numLearnClose(); });
  var lrOverlay = document.getElementById('learn-modal');
  if(lrOverlay) lrOverlay.addEventListener('click', function(e){ if(e.target===this) numLearnClose(); });

  // Language modal
  var lmClose = document.getElementById('lm-close-btn');
  if(lmClose) lmClose.addEventListener('click', closeLangModal);
  var lmOverlay = document.getElementById('lang-modal');
  if(lmOverlay) lmOverlay.addEventListener('click', function(e){ if(e.target===this) closeLangModal(); });

  // ── Мої послуги ───────────────────────────────────────────
  var svcItems = document.getElementById('svc-items');
  if(svcItems) svcItems.addEventListener('click', function(e){
    var b = e.target.closest('.svc-item');
    if(!b || !b.dataset.svc) return;
    /* Відгук на дотик: вібрація + «пружинка» картки, і лише потім перехід. */
    hapticTap();
    b.classList.remove('tap'); void b.offsetWidth; b.classList.add('tap');
    setTimeout(function(){ svcOpenDetail(b.dataset.svc); }, 150);
  });
  var svcCta = document.getElementById('svc-cta');
  if(svcCta) svcCta.addEventListener('click', svcCtaGo);
  var svcBack = document.getElementById('svc-back-list');
  if(svcBack) svcBack.addEventListener('click', function(){ goBack('svc-list'); });

  // ── Нумерологія ───────────────────────────────────────────
  /* Кнопки «назад» модуля. Усі через той самий стек: схема — хаб, тож
     з підекранів повертає на неї, а зі схеми — на вхід у модуль. */
  [['btn-back-num-home','home'],
   ['btn-back-num-scheme','num-home'],
   ['btn-back-num-block','num-scheme'],
   /* Навчання відкривається зі сторінки блоку, тому й фолбек у неї, а не в
      схему: інакше «назад» вивело б на крок далі, ніж людина зайшла. */
   ['btn-back-num-learn','num-block'],
   ['btn-back-num-health','num-scheme'],
   ['btn-back-num-prognosis','num-scheme'],
   ['btn-back-num-energies','num-scheme'],
   ['btn-back-num-compat','num-home'],
   ['btn-back-svc-list','home'],
   ['btn-back-biz-list','home'],
   ['btn-back-svc-detail','svc-list']].forEach(function(pair){
    var el = document.getElementById(pair[0]);
    if(el) el.addEventListener('click', function(){ goBack(pair[1]); });
  });

  /* «Змінити дату» веде на вхід у модуль з УЖЕ розгорнутим полем іншої дати.
     Без setVis людина побачила б згорнутий блок і мусила б удруге шукати, де
     ж міняється дата, — а вона щойно натиснула саме цю кнопку. */
  var numChangeDate = document.getElementById('num-change-date');
  if(numChangeDate) numChangeDate.addEventListener('click', function(){
    numRenderHome(true);
    pushScreen('num-home');
    var inp = document.getElementById('num-other-inp');
    if(inp) inp.focus();
  });

  var numLearnConsult = document.getElementById('num-learn-consult');
  if(numLearnConsult) numLearnConsult.addEventListener('click', numConsultOpen);

  /* Тапи по схемі — делеговано на <svg>, а не по 33 обробники на групу:
     інакше кожна перемальовка або плодила б дублікати, або вимагала б
     знімати слухачі вручну. Element.closest працює і на SVG-вузлах. */
  var numSvg = document.getElementById('num-svg');
  if(numSvg){
    numSvg.addEventListener('click', function(e){
      var g = e.target.closest('[data-point-id]');
      if(g) numOpenPoint(g.dataset.pointId);
    });
    /* Кружки мають tabindex і role="button" — отже, мусять відкриватись
       і з клавіатури, інакше role бреше про поведінку. */
    numSvg.addEventListener('keydown', function(e){
      if(e.key !== 'Enter' && e.key !== ' ') return;
      var g = e.target.closest('[data-point-id]');
      if(!g) return;
      e.preventDefault();
      numOpenPoint(g.dataset.pointId);
    });
  }

  var numHints = document.getElementById('num-hints-toggle');
  if(numHints) numHints.addEventListener('click', numToggleHints);

  var numZoom = document.getElementById('num-zoom-toggle');
  if(numZoom) numZoom.addEventListener('click', numZoomOpen);
  [['num-zoom-plus',  function(){ numZoomStep(NUM_ZOOM_STEP); }],
   ['num-zoom-minus', function(){ numZoomStep(1 / NUM_ZOOM_STEP); }],
   ['num-zoom-close', numZoomClose]].forEach(function(pair){
    var el = document.getElementById(pair[0]);
    if(el) el.addEventListener('click', pair[1]);
  });
  numZoomBindPinch();
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && NUM.zoom) numZoomClose();
  });

  var btnEmptyGet = document.getElementById('btn-empty-get');
  if(btnEmptyGet) btnEmptyGet.addEventListener('click', function(){
    if(S._myStratModule) openModAccess(S._myStratModule);
    else show('home');
  });

  var numSheetX = document.getElementById('num-sheet-close');
  if(numSheetX) numSheetX.addEventListener('click', numSheetClose);
  var numSheetOv = document.getElementById('num-sheet');
  if(numSheetOv) numSheetOv.addEventListener('click', function(e){ if(e.target===this) numSheetClose(); });

  // BOOT
  boot();
});

})();