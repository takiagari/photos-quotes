const { createApp } = Vue;

createApp({
  // アプリケーションのデータを定義
  data() {
    return {
      apiKey: '', // Unsplash APIキーの初期値
      loading: false, // ローディング状態の初期値
      cards: [], // カードデータの初期値（空の配列）
    };
  },
  // コンポーネントがマウントされたときに実行される
  mounted() {
    // URLからAPIキーを取得
    this.apiKey = this.getApiKeyFromUrl();
    // 初回の名言と画像を取得
    this.fetchQuotesAndImages();
    // スクロールイベントリスナーを追加
    window.addEventListener('scroll', this.handleScroll);
  },
  // コンポーネントがアンマウントされる前に実行される
  beforeUnmount() {
    // スクロールイベントリスナーを削除
    window.removeEventListener('scroll', this.handleScroll);
  },
  // アプリケーションのメソッドを定義
  methods: {
    /**
     * URLからAPIキーを取得するメソッド
     * @returns {string} 取得したAPIキー
     */
    getApiKeyFromUrl() {
      const params = new URLSearchParams(window.location.search);
      return params.get('apikey') || '';
    },
    
    /**
     * ページを再読み込みするメソッド
     * APIキーが入力されている場合、URLに追加して再読み込み
     * 入力されていない場合、単純に再読み込み
     */
    reloadPage() {
      if (this.apiKey.trim()) {
        // APIキーが入力されている場合、URLに追加して再読み込み
        window.location.href = `${window.location.pathname}?apikey=${this.apiKey.trim()}`;
      } else {
        // APIキーが入力されていない場合、単純に再読み込み
        window.location.reload();
      }
    },

    /**
     * 名言と画像を取得するメソッド
     * 各カードに対して非同期で名言と画像の取得を行い、カードに設定する
     */
    async fetchQuotesAndImages() {
      // 既にローディング中の場合は処理を中断
      if (this.loading) return;

      // ローディング状態をtrueに設定
      this.loading = true;
      const quotePromises = [];
      const imagePromises = [];

      // 6つの名言と画像を取得するためのPromiseを作成
      for (let i = 0; i < 6; i++) {
        // 名言を取得するためのPromiseを作成
        quotePromises.push(
          fetch('https://api.quotable.io/random')
            .then(response => response.json())
            .then(data => data.content)
            .catch(() => '名言を取得できませんでした。')
        );

        // APIキーがある場合、Unsplashから画像を取得
        if (this.apiKey) {
          imagePromises.push(this.fetchPhotos());
        } else {
          // APIキーがない場合、犬の画像を取得
          imagePromises.push(
            fetch('https://dog.ceo/api/breeds/image/random')
              .then(response => response.json())
              .then(data => data.message)
              .catch(() => '画像を取得できませんでした。')
          );
        }
      }

      try {
        // 全ての名言と画像を非同期で取得
        const quotes = await Promise.all(quotePromises);
        const images = await Promise.all(imagePromises);

        // 新しいカードデータを作成
        const newCards = quotes.map((quote, index) => ({
          image: images[index],
          quote,
        }));

        // 既存のカードデータに新しいカードデータを追加
        this.cards.push(...newCards); // 既存のカードデータに新しいカードを追加
      } catch (error) {
        console.info('すべての画像を取得するのに失敗しました。');
      } finally {
        // ローディング状態を解除
        this.loading = false;
      }
    },

    /**
     * 画像を取得するメソッド
     * APIキーがある場合はUnsplashから画像を取得し、なければ犬の画像APIから取得する
     * @returns {Promise<string>} 取得した画像のURL
     */
    async fetchPhotos() {
      if (this.apiKey) {
        // Unsplashからランダムな写真を取得
        try {
          const response = await fetch(`https://api.unsplash.com/photos/random?client_id=${this.apiKey}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          return data.urls.regular;
        } catch (error) {
          // Unsplashから画像の取得に失敗した場合、犬の画像APIから画像を取得
          try {
            const response = await fetch('https://dog.ceo/api/breeds/image/random');
            const data = await response.json();
            return data.message;
          } catch {
            // どちらのAPIからも取得に失敗した場合、エラーメッセージを返す
            return '画像を取得できませんでした。';
          }
        }
      } else {
        // APIキーがない場合、犬の画像APIからランダムな画像を取得
        try {
          const response = await fetch('https://dog.ceo/api/breeds/image/random');
          const data = await response.json();
          return data.message;
        } catch {
          // 取得に失敗した場合、エラーメッセージを返す
          return '画像を取得できませんでした。';
        }
      }
    },

    /**
     * 画像の読み込みが完了した際に呼ばれるメソッド
     * 画像にloadedクラスを追加してフェードイン効果を適用
     */
    imageLoaded(event) {
      event.target.classList.add('loaded');
    },

    /**
     * スクロールイベントのハンドラー
     * ページの一番下に到達した場合に追加データを取得
     */
    handleScroll() {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 2) {
        if (!this.loading) {
          this.fetchQuotesAndImages();
        }
      }
    }
  }
}).mount('#app');
