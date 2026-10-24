import React from 'react';

/**
 * صحنه سینمایی سه‌مرحله‌ای با نورپردازی حجمی و آناتومی واقع‌گرایانه (Volumetric 3D-Lit Narrative Scene)
 * بدون هرگونه متن اضافه، فلش یا شکلک کارتونی:
 * ۱. چپ: نشسته روی چهارپایه، آرنج‌ها روی زانو و سر در میان دست‌ها مقابل میز و لپ‌تاپ
 * ۲. مرکز: همان فرد در حال قدم گذاشتن و ورود به درون دروازه نوری CONCEPT STUDIO
 * ۳. راست: ایستاده در کنار همان میز و چهارپایه و لپ‌تاپ، با فنجان قهوه/چای گرم در دست و لبخندی ملایم
 */
export const PortalStoryScene: React.FC = () => {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden mb-5 border border-cyan-500/30 bg-[#050914] shadow-[inset_0_0_60px_rgba(0,0,0,0.85)]">
      {/* نورهای حجمی محیطی (Volumetric Ambient Lighting) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 38% 75% at 50% 48%, rgba(0, 229, 255, 0.24) 0%, rgba(14, 165, 233, 0.08) 45%, transparent 75%), radial-gradient(ellipse 35% 60% at 82% 50%, rgba(56, 189, 248, 0.12) 0%, transparent 70%), radial-gradient(ellipse 30% 55% at 18% 55%, rgba(30, 41, 59, 0.5) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <svg
        viewBox="0 0 960 320"
        className="w-full h-52 sm:h-64 md:h-72 object-cover select-none block"
        role="img"
        aria-label="روایت سه مرحله‌ای عبور از دروازه CONCEPT STUDIO"
      >
        <defs>
          {/* گرادینت‌های حجمی سه‌بعدی برای پوست، لباس، نور ریم (Rim Light) و سطوح */}
          <linearGradient id="bgStudioDepth" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#050811" />
            <stop offset="42%" stopColor="#081226" />
            <stop offset="55%" stopColor="#0B1D36" />
            <stop offset="100%" stopColor="#071526" />
          </linearGradient>

          <linearGradient id="floorReflection" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0A1426" />
            <stop offset="30%" stopColor="#070E1C" />
            <stop offset="100%" stopColor="#03060C" />
          </linearGradient>

          {/* نور دروازه مرکزی */}
          <linearGradient id="portalFrame3D" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="35%" stopColor="#00E5FF" />
            <stop offset="80%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>

          <radialGradient id="portalCoreLight" cx="50%" cy="48%" r="55%">
            <stop offset="0%" stopColor="rgba(224, 242, 254, 0.92)" />
            <stop offset="30%" stopColor="rgba(0, 229, 255, 0.55)" />
            <stop offset="65%" stopColor="rgba(2, 132, 199, 0.2)" />
            <stop offset="100%" stopColor="rgba(5, 9, 20, 0)" />
          </radialGradient>

          <linearGradient id="portalLightSpill" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="rgba(0, 229, 255, 0.42)" />
            <stop offset="100%" stopColor="rgba(0, 229, 255, 0)" />
          </linearGradient>

          {/* گرادینت‌های حجمی کاراکتر ۱ (در سایه سرد و نور لپ‌تاپ) */}
          <linearGradient id="skinLitLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2B897" />
            <stop offset="55%" stopColor="#B88666" />
            <stop offset="100%" stopColor="#6E4B3A" />
          </linearGradient>

          <linearGradient id="jacketLeft3D" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="45%" stopColor="#1E293B" />
            <stop offset="85%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          <linearGradient id="pantsLeft3D" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="70%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#090D16" />
          </linearGradient>

          {/* گرادینت‌های حجمی کاراکتر ۲ (در حال ورود به دروازه با Rim Light شدید فیروزه‌ای) */}
          <linearGradient id="jacketPortalStep" x1="0%" y1="20%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="50%" stopColor="#1E3A5F" />
            <stop offset="82%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#E0F2FE" />
          </linearGradient>

          <linearGradient id="pantsPortalStep" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#0B1120" />
            <stop offset="65%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          <linearGradient id="skinPortalRim" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#9A6B50" />
            <stop offset="60%" stopColor="#DFAFA0" />
            <stop offset="100%" stopColor="#E0F2FE" />
          </linearGradient>

          {/* گرادینت‌های حجمی کاراکتر ۳ (سمت راست - در نور گرم و روشن استودیو با فنجان قهوه) */}
          <linearGradient id="skinWarmRight" x1="100%" y1="20%" x2="0%" y2="80%">
            <stop offset="0%" stopColor="#F5D0B5" />
            <stop offset="50%" stopColor="#D9A17C" />
            <stop offset="100%" stopColor="#8C5A3C" />
          </linearGradient>

          <linearGradient id="jacketRight3D" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="18%" stopColor="#0284C7" />
            <stop offset="65%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          <linearGradient id="deskSurface3D" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          <linearGradient id="laptopScreenGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>

          <linearGradient id="mugGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="60%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          <filter id="softGlow3D" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="subtleShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.65" />
          </filter>
        </defs>

        {/* پس‌زمینه استودیویی سه‌بعدی */}
        <rect x="0" y="0" width="960" height="252" fill="url(#bgStudioDepth)" />
        {/* کف صیقلی استودیو با انعکاس نور */}
        <rect x="0" y="252" width="960" height="68" fill="url(#floorReflection)" />

        {/* خطوط پرسپکتیو کف استودیو */}
        <g stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1">
          <line x1="0" y1="252" x2="960" y2="252" stroke="rgba(56, 189, 248, 0.22)" strokeWidth="1.5" />
          <line x1="0" y1="268" x2="960" y2="268" />
          <line x1="0" y1="288" x2="960" y2="288" />
          <line x1="0" y1="312" x2="960" y2="312" />
          <line x1="480" y1="252" x2="480" y2="320" />
          <line x1="420" y1="252" x2="340" y2="320" />
          <line x1="540" y1="252" x2="620" y2="320" />
          <line x1="320" y1="252" x2="160" y2="320" />
          <line x1="640" y1="252" x2="800" y2="320" />
        </g>

        {/* بازتاب نور دروازه روی زمین صیقلی */}
        <polygon
          points="415,252 545,252 635,320 325,320"
          fill="url(#portalLightSpill)"
        />
        <ellipse cx="480" cy="254" rx="85" ry="9" fill="rgba(0, 229, 255, 0.4)" filter="url(#softGlow3D)" />

        {/* ===================================================================== */}
        {/* مرحله ۱ (سمت چپ): مرد نشسته روی چهارپایه، آرنج روی زانو، دست‌ها روی سر، میز و لپ‌تاپ مقابلش */}
        {/* ===================================================================== */}
        <g transform="translate(55, 0)" filter="url(#subtleShadow)">
          {/* سایه روی زمین */}
          <ellipse cx="125" cy="256" rx="105" ry="7" fill="rgba(0,0,0,0.65)" />

          {/* چهارپایه مدرن استودیویی (Stool) */}
          <g>
            {/* پایه‌های فلزی سه‌بعدی چهارپایه */}
            <path d="M 46 184 L 34 253" stroke="#1E293B" strokeWidth="6" strokeLinecap="round" />
            <path d="M 46 184 L 34 253" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 78 184 L 88 253" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
            <path d="M 78 184 L 88 253" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 62 184 L 62 254" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
            {/* رکاب استراحت پا */}
            <ellipse cx="61" cy="222" rx="22" ry="3.5" fill="none" stroke="#475569" strokeWidth="2.5" />
            {/* نشیمنگاه چرمی حجمی چهارپایه */}
            <rect x="36" y="173" width="52" height="12" rx="6" fill="#1E293B" stroke="#475569" strokeWidth="1.2" />
            <path d="M 40 176 Q 62 173 84 176" fill="none" stroke="#64748B" strokeWidth="1.5" />
          </g>

          {/* کاراکتر مرحله ۱ با تناسبات طبیعی و حجم‌دهی سه‌بعدی */}
          <g>
            {/* پای عقب (چپ) */}
            <path
              d="M 55 174 C 72 174, 96 178, 102 184 C 106 190, 102 222, 100 244 L 88 244 C 89 220, 91 196, 88 190 C 78 188, 58 186, 48 182 Z"
              fill="#0B1120"
            />
            {/* کفش عقب */}
            <path d="M 86 242 L 112 242 C 116 242, 118 248, 113 250 L 85 250 Z" fill="#1E293B" />

            {/* پای جلو (راست) با زانوی خم‌شده که آرنج رویش قرار می‌گیرد */}
            <path
              d="M 48 175 C 68 173, 94 176, 106 182 C 112 186, 110 218, 107 246 L 93 246 C 94 222, 95 198, 92 192 C 78 190, 56 188, 44 182 Z"
              fill="url(#pantsLeft3D)"
              stroke="rgba(148,163,184,0.18)"
              strokeWidth="0.8"
            />
            {/* کفش جلو با جزئیات کفه */}
            <path d="M 91 244 L 120 244 C 125 244, 127 251, 120 252 L 90 252 Z" fill="#334155" />
            <line x1="90" y1="251" x2="123" y2="251" stroke="#94A3B8" strokeWidth="1.8" />

            {/* نیم‌تنه و کت/هودی مرد که از کمر به جلو خم شده است */}
            <path
              d="M 42 175 C 36 146, 46 116, 74 106 C 92 100, 108 108, 112 122 C 106 142, 86 164, 62 176 Z"
              fill="url(#jacketLeft3D)"
              stroke="rgba(56, 189, 248, 0.22)"
              strokeWidth="1"
            />
            {/* چین‌وچروک طبیعی پارچه لباس */}
            <path d="M 56 138 Q 75 132 92 142 M 50 154 Q 68 148 84 156" fill="none" stroke="rgba(15,23,42,0.7)" strokeWidth="2" />

            {/* سر و گردن خم‌شده به پایین در میان دست‌ها */}
            <path d="M 98 110 C 106 104, 116 106, 120 116 C 122 126, 114 134, 104 132 C 96 130, 93 118, 98 110 Z" fill="url(#skinLitLeft)" />
            {/* حجم موهای سر با نور آبی ملایم صفحه لپ‌تاپ */}
            <path
              d="M 96 108 C 102 96, 118 96, 125 106 C 128 112, 125 120, 121 122 C 118 114, 110 108, 96 108 Z"
              fill="#0F172A"
            />

            {/* بازو، آرنج تکیه‌داده بر زانو و ساعد و دست‌ها که دو طرف سر را گرفته‌اند */}
            <path
              d="M 82 114 C 90 132, 98 158, 102 180 C 104 183, 108 182, 110 178 C 114 158, 116 136, 116 116"
              fill="none"
              stroke="#1E293B"
              strokeWidth="13"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 82 114 C 90 132, 98 158, 102 180 C 104 183, 108 182, 110 178 C 114 158, 116 136, 116 116"
              fill="none"
              stroke="#334155"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* مچ دست و انگشتان واقع‌گرایانه در حال گرفتن پیشانی و سر */}
            <path
              d="M 113 118 C 114 110, 119 105, 123 108 C 125 111, 121 118, 116 120 Z"
              fill="url(#skinLitLeft)"
            />
          </g>

          {/* میز کار و لپ‌تاپ روشن مقابل فرد کلافه */}
          <g transform="translate(132, 0)">
            {/* پایه‌های فلزی میز */}
            <rect x="14" y="168" width="6" height="85" rx="2" fill="#1E293B" />
            <rect x="96" y="168" width="6" height="85" rx="2" fill="#0F172A" />
            <path d="M 8 252 L 28 252 M 90 252 L 110 252" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
            {/* صفحه میز */}
            <rect x="0" y="162" width="118" height="7" rx="3" fill="url(#deskSurface3D)" stroke="rgba(148,163,184,0.25)" strokeWidth="0.8" />

            {/* لپ‌تاپ باز روی میز (رو به سمت کاراکتر) */}
            <rect x="16" y="158" width="48" height="4" rx="2" fill="#94A3B8" />
            <polygon points="56,160 68,124 72,125 61,160" fill="#CBD5E1" />
            {/* تابش نور ملایم صفحه لپ‌تاپ به سمت صورت و دست‌های کاراکتر */}
            <polygon
              points="56,158 68,125 -35,98 -45,162"
              fill="rgba(56, 189, 248, 0.09)"
            />
            {/* گوشی موبایل کنار لپ‌تاپ */}
            <rect x="78" y="159" width="18" height="3" rx="1.5" fill="#64748B" />
          </g>
        </g>

        {/* ===================================================================== */}
        {/* مرحله ۲ (مرکز): دروازه نوری CONCEPT STUDIO و همان فرد در حال قدم گذاشتن به درون دروازه */}
        {/* ===================================================================== */}
        <g transform="translate(480, 0)">
          {/* هاله نوری پشت دروازه */}
          <ellipse cx="0" cy="140" rx="88" ry="118" fill="url(#portalCoreLight)" />

          {/* پرتوهای حجمی که از درون دروازه به بیرون می‌تابند */}
          <polygon
            points="-56,36 56,36 110,252 -110,252"
            fill="rgba(0, 229, 255, 0.08)"
          />

          {/* قاب پشتی سه‌بعدی دروازه */}
          <rect
            x="-64"
            y="28"
            width="128"
            height="224"
            rx="16"
            fill="rgba(4, 12, 28, 0.75)"
            stroke="rgba(0, 229, 255, 0.35)"
            strokeWidth="2"
          />

          {/* پرده انرژی درخشان درون چارچوب دروازه */}
          <rect
            x="-54"
            y="42"
            width="108"
            height="208"
            rx="10"
            fill="url(#portalCoreLight)"
          />

          {/* خطوط ظریف شبکه عمق داخل دروازه */}
          <g stroke="rgba(224, 242, 254, 0.22)" strokeWidth="1">
            <line x1="-54" y1="90" x2="54" y2="90" />
            <line x1="-54" y1="140" x2="54" y2="140" />
            <line x1="-54" y1="190" x2="54" y2="190" />
            <line x1="0" y1="42" x2="0" y2="250" strokeDasharray="3 6" />
          </g>

          {/* کاراکتر مرحله ۲: همان فرد در حال گام برداشتن و ورود به درون دروازه نوری */}
          <g transform="translate(-14, 0)" filter="url(#subtleShadow)">
            {/* سایه کشیده فرد روی آستانه دروازه */}
            <ellipse cx="14" cy="253" rx="38" ry="6" fill="rgba(2, 132, 199, 0.45)" />

            {/* پای عقب (چپ - در حال بلند شدن از زمین برای گام برداشتن) */}
            <path
              d="M -6 158 C -12 182, -22 208, -32 232 L -20 236 C -8 214, 2 188, 10 162 Z"
              fill="#0F172A"
              stroke="rgba(56, 189, 248, 0.35)"
              strokeWidth="1"
            />
            {/* کفش پای عقب در حالت گام */}
            <path d="M -35 230 L -16 236 C -13 238, -15 244, -20 243 L -38 236 Z" fill="#1E293B" />

            {/* پای جلو (راست - قدم گذاشته به درون نور دروازه) */}
            <path
              d="M 6 156 C 14 184, 22 214, 26 244 L 12 244 C 8 216, 0 188, -6 160 Z"
              fill="url(#pantsPortalStep)"
              stroke="#7DD3FC"
              strokeWidth="1.2"
            />
            {/* کفش پای جلو داخل دروازه */}
            <path d="M 10 242 L 38 242 C 42 242, 43 249, 37 250 L 10 250 Z" fill="#E0F2FE" />

            {/* نیم‌تنه و کت در حال حرکت رو به جلو به سمت داخل دروازه با نور ریم درخشان */}
            <path
              d="M -14 92 C -2 86, 16 88, 22 100 C 28 118, 24 142, 18 160 L -12 160 C -16 138, -18 112, -14 92 Z"
              fill="url(#jacketPortalStep)"
              stroke="#BAE6FD"
              strokeWidth="1.3"
            />

            {/* بازوی عقب در حال نوسان طبیعی راه رفتن */}
            <path
              d="M -8 98 C -16 116, -24 134, -28 148"
              fill="none"
              stroke="#1E293B"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <circle cx="-29" cy="151" r="4.5" fill="url(#skinPortalRim)" />

            {/* بازوی جلو که وارد هاله نور دروازه شده است */}
            <path
              d="M 12 98 C 20 114, 28 126, 36 134"
              fill="none"
              stroke="url(#jacketPortalStep)"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <circle cx="38" cy="136" r="4.8" fill="#E0F2FE" />

            {/* سر و نیم‌رخ طبیعی رو به جلو (به‌سمت نور دروازه) */}
            <path
              d="M 0 64 C 8 62, 17 67, 18 76 C 19 84, 13 90, 5 90 C -3 90, -6 82, -5 74 C -4 68, -2 65, 0 64 Z"
              fill="url(#skinPortalRim)"
            />
            {/* موی سر با خط نورانی فیروزه‌ای در لبه جلویی */}
            <path
              d="M -6 74 C -8 64, 0 56, 12 58 C 19 59, 22 65, 19 70 C 14 66, 6 66, 0 74 Z"
              fill="#0F172A"
              stroke="#7DD3FC"
              strokeWidth="0.9"
            />
          </g>

          {/* ستون‌ها و طاق نئونی دروازه CONCEPT STUDIO که کاراکتر از میان آن عبور می‌کند */}
          <path
            d="M -56 250 L -56 44 C -56 35, -50 30, -40 30 L 40 30 C 50 30, 56 35, 56 44 L 56 250"
            fill="none"
            stroke="url(#portalFrame3D)"
            strokeWidth="5"
            filter="url(#softGlow3D)"
          />
          <path
            d="M -56 250 L -56 44 C -56 35, -50 30, -40 30 L 40 30 C 50 30, 56 35, 56 44 L 56 250"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />

          {/* کتیبه بالای دروازه CONCEPT STUDIO */}
          <rect
            x="-76"
            y="14"
            width="152"
            height="26"
            rx="8"
            fill="#040B18"
            stroke="#00E5FF"
            strokeWidth="1.8"
          />
          <text
            x="0"
            y="31"
            textAnchor="middle"
            fill="#F8FAFC"
            fontSize="12"
            fontWeight="900"
            letterSpacing="2"
            fontFamily="Outfit, sans-serif"
          >
            CONCEPT STUDIO
          </text>
        </g>

        {/* ===================================================================== */}
        {/* مرحله ۳ (سمت راست): ایستاده در آرامش کنار همان صندلی و میز و لپ‌تاپ، فنجان قهوه در دست و لبخند ملایم */}
        {/* ===================================================================== */}
        <g transform="translate(645, 0)" filter="url(#subtleShadow)">
          {/* سایه نرم روی زمین */}
          <ellipse cx="120" cy="256" rx="110" ry="7" fill="rgba(0,0,0,0.55)" />

          {/* همان چهارپایه استودیویی که حالا آرام کنار میز قرار دارد */}
          <g transform="translate(-8, 0)">
            <path d="M 30 184 L 20 253" stroke="#1E293B" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M 30 184 L 20 253" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
            <path d="M 58 184 L 68 253" stroke="#1E293B" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M 58 184 L 68 253" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <path d="M 44 184 L 44 254" stroke="#1E293B" strokeWidth="4.5" strokeLinecap="round" />
            <ellipse cx="44" cy="222" rx="19" ry="3" fill="none" stroke="#64748B" strokeWidth="2.2" />
            <rect x="21" y="173" width="46" height="11" rx="5.5" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.2" />
          </g>

          {/* کاراکتر مرحله ۳: ایستاده با استایل طبیعی، فنجان قهوه در دست، نگاه به لپ‌تاپ و لبخند ملایم */}
          <g transform="translate(56, 0)">
            {/* پاها در حالت ایستاده راحت و طبیعی */}
            <path
              d="M 18 152 L 12 244 L 26 244 L 32 156 Z"
              fill="#0F172A"
              stroke="rgba(148,163,184,0.2)"
              strokeWidth="0.8"
            />
            <path
              d="M 34 152 L 38 244 L 52 244 L 48 152 Z"
              fill="#1E293B"
              stroke="rgba(56,189,248,0.25)"
              strokeWidth="0.8"
            />
            {/* کفش‌ها */}
            <path d="M 10 242 L 32 242 C 36 242, 36 249, 31 250 L 9 250 Z" fill="#334155" />
            <path d="M 36 242 L 62 242 C 67 242, 68 249, 62 250 L 35 250 Z" fill="#475569" />
            <line x1="35" y1="249" x2="65" y2="249" stroke="#E2E8F0" strokeWidth="1.6" />

            {/* نیم‌تنه و کت خوش‌فرم در حالت ایستاده */}
            <path
              d="M 10 82 C 20 76, 44 76, 52 84 C 56 106, 54 132, 50 154 L 14 154 C 10 132, 8 106, 10 82 Z"
              fill="url(#jacketRight3D)"
              stroke="rgba(125, 211, 252, 0.4)"
              strokeWidth="1"
            />
            {/* یقه و پیراهن زیر کت */}
            <polygon points="26,79 38,79 34,98" fill="#E2E8F0" />

            {/* دست چپ در جیب شلوار (ژست ایستادن آرام و بااعتمادبه‌نفس) */}
            <path
              d="M 14 88 C 6 108, 6 128, 16 148"
              fill="none"
              stroke="#1E293B"
              strokeWidth="11"
              strokeLinecap="round"
            />

            {/* سر و گردن با زاویه نگاه ملایم به سمت صفحه لپ‌تاپ و لبخند ریز و طبیعی */}
            <rect x="26" y="68" width="11" height="14" rx="4" fill="url(#skinWarmRight)" />
            <path
              d="M 22 46 C 32 44, 44 49, 45 60 C 46 69, 39 76, 30 75 C 21 74, 18 65, 19 56 C 19 50, 20 47, 22 46 Z"
              fill="url(#skinWarmRight)"
            />
            {/* حجم موی سر */}
            <path
              d="M 18 56 C 16 44, 26 36, 39 39 C 47 41, 49 48, 45 53 C 39 48, 28 48, 22 57 Z"
              fill="#0F172A"
            />
            {/* جزئیات چهره در نیم‌رخ سهولت‌یافته: چشم رو به لپ‌تاپ و لبخند ریز روی لب */}
            <path d="M 37 56 Q 40 55 42 56" fill="none" stroke="#1E293B" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="39.5" cy="58.5" r="1.3" fill="#0F172A" />
            {/* لبخند ریز و باوقار */}
            <path d="M 35 66 Q 39 69.5 42.5 65.5" fill="none" stroke="#5C3A21" strokeWidth="1.7" strokeLinecap="round" />

            {/* دست راست خم‌شده که فنجان قهوه/چای گرم را نگه داشته است */}
            <path
              d="M 45 90 C 52 106, 58 114, 72 108"
              fill="none"
              stroke="url(#jacketRight3D)"
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="75" cy="107" r="4.5" fill="url(#skinWarmRight)" />

            {/* فنجان سرامیکی قهوه / چای در دست همراه با بخار ملایم */}
            <g transform="translate(73, 93)">
              <rect x="0" y="0" width="15" height="17" rx="3.5" fill="url(#mugGrad)" stroke="#F59E0B" strokeWidth="1" />
              <path d="M 15 3.5 C 19.5 3.5, 19.5 12.5, 15 12.5" fill="none" stroke="#FDE68A" strokeWidth="2" />
              {/* بخار گرم و لطیف بالای فنجان */}
              <path
                d="M 5 -4 C 3 -10, 8 -14, 6 -20 M 11 -3 C 9 -9, 14 -13, 12 -19"
                fill="none"
                stroke="rgba(253, 230, 138, 0.65)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>
          </g>

          {/* همان میز کار و لپ‌تاپ روشن در سمت راست */}
          <g transform="translate(135, 0)">
            {/* پایه‌های میز */}
            <rect x="14" y="168" width="6" height="85" rx="2" fill="#1E293B" />
            <rect x="96" y="168" width="6" height="85" rx="2" fill="#0F172A" />
            <path d="M 8 252 L 28 252 M 90 252 L 110 252" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            {/* صفحه میز */}
            <rect x="0" y="162" width="118" height="7" rx="3" fill="url(#deskSurface3D)" stroke="rgba(56,189,248,0.35)" strokeWidth="0.9" />

            {/* لپ‌تاپ باز روی میز (رو به سمت کاراکتر ایستاده) */}
            <rect x="18" y="158" width="50" height="4" rx="2" fill="#CBD5E1" />
            <polygon points="58,160 71,122 75,123 63,160" fill="url(#laptopScreenGlow)" />
            {/* بازتاب نور آرام‌بخش و روشن صفحه لپ‌تاپ */}
            <polygon
              points="58,158 71,123 -25,82 -35,158"
              fill="rgba(56, 189, 248, 0.14)"
            />
          </g>
        </g>
      </svg>
    </div>
  );
};
