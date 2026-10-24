/**
 * منطق تعاملی لندینگ‌پیج استودیو
 * شامل: انیمیشن شمارنده و آرک نئونی، تقویم فارسی، کپسول روزهای هفته و افکت‌های هاور نوری
 */

document.addEventListener('DOMContentLoaded', () => {
    initPersianDateAndStreak();
    initArcAndCounterAnimation();
    initScrollReveal();
    initCardGlowTracking();
});

/**
 * ۱. تنظیم تاریخ شمسی جاری و فعال‌سازی روز جاری در کپسول هفته
 */
function initPersianDateAndStreak() {
    const dateElement = document.getElementById('current-date');
    const now = new Date();

    // نمایش تاریخ شمسی به فرمت استاندارد فارسی
    try {
        const formatter = new Intl.DateTimeFormat('fa-IR', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        dateElement.textContent = formatter.format(now);
    } catch (e) {
        dateElement.textContent = 'امروز';
    }

    // مشخص کردن روز فعلی در کپسول هفته (getDay: 0=یکشنبه ... 6=شنبه)
    const currentDayIndex = now.getDay();
    // ترتیب روزهای هفته ایرانی از شنبه تا جمعه
    const iranianWeekOrder = [6, 0, 1, 2, 3, 4, 5];
    const currentPosInWeek = iranianWeekOrder.indexOf(currentDayIndex);

    const dayElements = document.querySelectorAll('.day-item');
    dayElements.forEach((item) => {
        const itemDay = parseInt(item.getAttribute('data-day'), 10);
        const itemPos = iranianWeekOrder.indexOf(itemDay);

        if (itemDay === currentDayIndex) {
            item.classList.add('active');
        } else if (itemPos < currentPosInWeek) {
            item.classList.add('passed');
        }

        // امکان کلیک تعاملی روی روزهای هفته
        item.addEventListener('click', () => {
            dayElements.forEach(d => d.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

/**
 * ۲. انیمیشن همزمان پر شدن آرک آبی نئونی و شمارنده از ۰ تا ۱۹,۵۳۸
 */
function initArcAndCounterAnimation() {
    const arcPath = document.getElementById('arc-progress');
    const counterEl = document.getElementById('step-counter');
    if (!arcPath || !counterEl) return;

    const targetNumber = 19538;
    const duration = 2300; // مدت زمان انیمیشن بر حسب میلی‌ثانیه
    const targetFillRatio = 0.86; // پر شدن ۸۶ درصد از آرک برای زیبایی بصری

    // محاسبه طول دقیق مسیر SVG
    const totalLength = arcPath.getTotalLength();
    arcPath.style.strokeDasharray = `${totalLength}`;
    arcPath.style.strokeDashoffset = `${totalLength}`;

    const persianFormatter = new Intl.NumberFormat('fa-IR');
    let startTime = null;

    // تابع زمان‌بندی روان (Ease OutQuart)
    function easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    function animateFrame(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuart(progress);

        // بروزرسانی عدد شمارنده
        const currentCount = Math.floor(easedProgress * targetNumber);
        counterEl.textContent = persianFormatter.format(currentCount);

        // بروزرسانی خط آرک نئونی
        const currentOffset = totalLength * (1 - easedProgress * targetFillRatio);
        arcPath.style.strokeDashoffset = `${currentOffset}`;

        if (progress < 1) {
            requestAnimationFrame(animateFrame);
        } else {
            counterEl.textContent = persianFormatter.format(targetNumber);
        }
    }

    // شروع انیمیشن با کمی تاخیر برای بارگذاری کامل صفحه
    setTimeout(() => {
        requestAnimationFrame(animateFrame);
    }, 250);
}

/**
 * ۳. ظاهر شدن نرم کارت‌های خدمات هنگام اسکرول (Intersection Observer)
 */
function initScrollReveal() {
    const cards = document.querySelectorAll('.service-card');

    const observerOptions = {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // ایجاد تاخیر پله‌ای ظریف بین کارت‌ها
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, (index % 2) * 90);
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    cards.forEach(card => observer.observe(card));
}

/**
 * ۴. افکت دنبال‌کننده نور موس روی کارت‌های شیشه‌ای
 */
function initCardGlowTracking() {
    const cards = document.querySelectorAll('.service-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}