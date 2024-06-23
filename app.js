const { createApp, ref, onMounted, onBeforeUnmount } = Vue;

createApp({
  setup() {
    const apiKey = ref(''); // Unsplash APIキーの初期値
    const loading = ref(false); // ローディング状態の初期値
    const cards = ref([]); // カードデータの初期値（空の配列）

    /**
     * URLからAPIキーを取得するメソッド
     * @returns {string} 取得したAPIキー
     */
    const getApiKeyFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      return params.get('apikey') || '';
    };

    /**
     * ページを再読み込みするメソッド
     * APIキーが入力されている場合、URLに追加して再読み込み
     * 入力されていない場合、単純に再読み込み
     */
    const reloadPage = () => {
      if (apiKey.value.trim()) {
        // APIキーが入力されている場合、URLに追加して再読み込み
        window.location.href = `${window.location.pathname}?apikey=${apiKey.value.trim()}`;
      } else {
        // APIキーが入力されていない場合、単純に再読み込み
        window.location.reload();
      }
    };

    /**
     * 名言を取得するメソッド
     * @returns {Promise<string>} 取得した名言
     */
    const fetchQuote = () => {
      return fetch('https://api.quotable.io/random')
        .then(response => response.json())
        .then(data => data.content)
        .catch(() => '名言を取得できませんでした。');
    };

    /**
     * 画像を取得するメソッド
     * APIキーがある場合はUnsplashから画像を取得し、なければ犬の画像APIから取得する
     * @returns {Promise<string>} 取得した画像のURL
     */
    const fetchPhoto = async () => {
      // APIキーがある場合、Unsplashからランダムな写真を取得
      if (apiKey.value) {
        try {
          const response = await fetch(`https://api.unsplash.com/photos/random?client_id=${apiKey.value}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          // Unsplashのレスポンスから標準サイズの画像URLを取得
          return data.urls.regular;
        } catch (error) {
          // Unsplashから画像の取得に失敗した場合、犬の画像APIから画像を取得
          return fetchDogPhoto();
        }
      } else {
        // APIキーがない場合、犬の画像APIからランダムな画像を取得
        return fetchDogPhoto();
      }
    };

    /**
     * 犬の画像を取得するメソッド
     * @returns {Promise<string>} 取得した犬の画像のURL
     */
    const fetchDogPhoto = () => {
      return fetch('https://dog.ceo/api/breeds/image/random')
        .then(response => response.json())
        .then(data => data.message)
        .catch(() => '画像を取得できませんでした。');
    };

    /**
     * 名言と画像を取得するメソッド
     * 各カードに対して非同期で名言と画像の取得を行い、カードに設定する
     */
    const fetchQuotesAndImages = async () => {
      // 既にローディング中の場合は処理を中断
      if (loading.value) return;
      // ローディング状態をtrueに設定
      loading.value = true;

      try {
        // 6つの名言と画像を取得するPromiseを作成
        const quotePromises = Array.from({ length: 6 }, fetchQuote);
        const imagePromises = Array.from({ length: 6 }, fetchPhoto);

        // 全ての名言と画像を非同期で取得
        const quotes = await Promise.all(quotePromises);
        const images = await Promise.all(imagePromises);

        // 新しいカードデータを作成
        const newCards = quotes.map((quote, index) => ({
          image: images[index],
          quote,
        }));

        // 既存のカードデータに新しいカードデータを追加
        cards.value.push(...newCards);
      } catch (error) {
        console.info('すべての画像を取得するのに失敗しました。');
      } finally {
        // ローディング状態を解除
        loading.value = false;
      }
    };

    /**
     * 画像の読み込みが完了した際に呼ばれるメソッド
     * 画像にloadedクラスを追加してフェードイン効果を適用
     */
    const imageLoaded = (event) => {
      event.target.classList.add('loaded');
    };

    /**
     * スクロールイベントのハンドラー
     * ページの一番下に到達した場合に追加データを取得
     */
    const handleScroll = () => {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 2) {
        if (!loading.value) {
          fetchQuotesAndImages();
        }
      }
    };

    onMounted(() => {
      // コンポーネントがマウントされたときに実行される
      // URLからAPIキーを取得
      apiKey.value = getApiKeyFromUrl();
      // 初回の名言と画像を取得
      fetchQuotesAndImages();
      // スクロールイベントリスナーを追加
      window.addEventListener('scroll', handleScroll);
    });

    onBeforeUnmount(() => {
      // コンポーネントがアンマウントされる前に実行される
      // スクロールイベントリスナーを削除
      window.removeEventListener('scroll', handleScroll);
    });

    return {
      apiKey,
      loading,
      cards,
      reloadPage,
      fetchQuotesAndImages,
      imageLoaded,
      handleScroll
    };
  }
}).mount('#app');
