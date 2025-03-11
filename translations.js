const translations = {
    "en": {"pageTitle": "Free Foot Traffic Estimator | Plan Your New Business Location", "metaDescription": "Estimate foot traffic for your business location using our free interactive map.", "headerTitle": "Estimate Foot Traffic for Your Business. For FREE", "headerSubtitle": "Analyze foot traffic and find the best location for your store, restaurant, or office.", "loadingText": "Calculating Foot Traffic in the Area...", "mapPlaceholder": "Loading map..."},
    "zh": {"pageTitle": "免费人流量估算器 | 规划您的新商铺位置", "metaDescription": "使用我们的免费互动地图估算您的商业位置人流量。", "headerTitle": "估算您的商业人流量。免费！", "headerSubtitle": "分析人流量并找到最佳商店、餐厅或办公地点。", "loadingText": "正在计算该地区的人流量...", "mapPlaceholder": "加载地图..."},
    "es": {"pageTitle": "Estimador de Tráfico Peatonal Gratis | Planifique su Ubicación Comercial", "metaDescription": "Estime el tráfico peatonal para la ubicación de su negocio con nuestro mapa interactivo gratuito.", "headerTitle": "Estime el tráfico peatonal para su negocio. GRATIS", "headerSubtitle": "Analice el tráfico peatonal y encuentre la mejor ubicación para su tienda, restaurante u oficina.", "loadingText": "Calculando el tráfico peatonal en el área...", "mapPlaceholder": "Cargando mapa..."},
    "ar": {"pageTitle": "مقدر حركة المشاة المجاني | خطط لموقع عملك الجديد", "metaDescription": "قم بتقدير حركة المشاة لموقع عملك باستخدام خريطتنا التفاعلية المجانية.", "headerTitle": "قم بتقدير حركة المشاة لعملك. مجانًا!", "headerSubtitle": "قم بتحليل حركة المشاة واعثر على أفضل موقع لمتجرك أو مطعمك أو مكتبك.", "loadingText": "جاري حساب حركة المشاة في المنطقة...", "mapPlaceholder": "تحميل الخريطة..."},
    "id": {"pageTitle": "Perkiraan Lalu Lintas Pejalan Kaki Gratis | Rencanakan Lokasi Bisnis Baru Anda", "metaDescription": "Perkirakan lalu lintas pejalan kaki untuk lokasi bisnis Anda menggunakan peta interaktif gratis kami.", "headerTitle": "Perkirakan Lalu Lintas Pejalan Kaki untuk Bisnis Anda. GRATIS!", "headerSubtitle": "Analisis lalu lintas pejalan kaki dan temukan lokasi terbaik untuk toko, restoran, atau kantor Anda.", "loadingText": "Menghitung lalu lintas pejalan kaki di area ini...", "mapPlaceholder": "Memuat peta..."},
    "pt": {"pageTitle": "Estimador de Tráfego de Pedestres Grátis | Planeje Sua Nova Localização Comercial", "metaDescription": "Estime o tráfego de pedestres para o local do seu negócio usando nosso mapa interativo gratuito.", "headerTitle": "Estime o tráfego de pedestres para o seu negócio. GRÁTIS!", "headerSubtitle": "Analise o tráfego de pedestres e encontre o melhor local para sua loja, restaurante ou escritório.", "loadingText": "Calculando o tráfego de pedestres na área...", "mapPlaceholder": "Carregando mapa..."},
    "ja": {"pageTitle": "無料の歩行者交通量推定ツール | 新しいビジネスの場所を計画", "metaDescription": "無料のインタラクティブマップを使用して、ビジネスの立地の歩行者数を推定します。", "headerTitle": "ビジネスの歩行者数を推定しましょう。無料！", "headerSubtitle": "歩行者の流れを分析し、店舗、レストラン、オフィスに最適な場所を見つけましょう。", "loadingText": "エリアの歩行者交通量を計算中...", "mapPlaceholder": "マップを読み込み中..."},
    "ru": {"pageTitle": "Бесплатный Оценщик Потока Людей | Планируйте Ваше Бизнес-Место", "metaDescription": "Оцените поток пешеходов для вашего бизнеса с помощью нашей бесплатной интерактивной карты.", "headerTitle": "Оцените поток людей для вашего бизнеса. БЕСПЛАТНО", "headerSubtitle": "Анализируйте поток пешеходов и находите лучшее место для вашего магазина, ресторана или офиса.", "loadingText": "Рассчитываем поток людей в области...", "mapPlaceholder": "Загрузка карты..."},
    "uk": {"pageTitle": "Безкоштовний оцінювач пішохідного трафіку | Плануйте своє бізнес-місце", "metaDescription": "Оцініть пішохідний трафік для вашого бізнесу за допомогою нашої безкоштовної інтерактивної карти.", "headerTitle": "Оцініть пішохідний трафік для вашого бізнесу. БЕЗКОШТОВНО", "headerSubtitle": "Аналізуйте пішохідний трафік і знаходьте найкраще місце для магазину, ресторану чи офісу.", "loadingText": "Обчислення пішохідного трафіку в цій області...", "mapPlaceholder": "Завантаження карти..."}
};

function setLanguage(lang) {
    if (translations[lang]) {
        document.getElementById("page-title").textContent = translations[lang].pageTitle;
        document.querySelector('meta[name="description"]').setAttribute("content", translations[lang].metaDescription);
        document.getElementById("title-block").querySelector("h1").textContent = translations[lang].headerTitle;
        document.getElementById("title-block").querySelector("p").textContent = translations[lang].headerSubtitle;
        document.getElementById("loading").textContent = translations[lang].loadingText;
        if (document.getElementById("map")) document.getElementById("map").setAttribute("data-placeholder", translations[lang].mapPlaceholder);
    }
}

const userLang = navigator.language.substring(0, 2);
if (translations[userLang]) {
    setLanguage(userLang);
}
