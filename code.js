/* eslint-disable */
// [НАЧАЛО КОДА]
class UltimateFirebaseExtension {
    constructor(runtime) {
        this.runtime = runtime;
        this.firebase = null;
        this.auth = null;
        this.db = null;
        this.firestore = null;
        this.storage = null;
        this.functions = null;
        this.analytics = null;
        this.remoteConfig = null;
        this.performance = null;
        this.currentUser = null;
        this.phoneConfirmationResult = null;
        this.mfaResolver = null;
        this.persistenceType = 'local';
        this.lastErrorMessage = '';
        this.lastReceivedData = ''; 
        this.lastFirestoreData = ''; 
        this.lastFirestoreQueryResult = ''; 
        this.lastRtdbQueryResult = ''; 
        this.lastFunctionResult = '';
        this.isInitialized = false;

        this.dbListeners = new Map();
        this.firestoreListeners = new Map();
        this.traces = new Map();

        this.runtime.on('PROJECT_STOP_ALL', () => {
            // Очистка слушателей Realtime Database
            if (this.db) { this.dbListeners.forEach((listener, path) => this.db.ref(path).off('value', listener)); }
            this.dbListeners.clear();
            
            // Очистка слушателей Firestore
            if (this.firestore) { this.firestoreListeners.forEach(unsubscribe => unsubscribe()); }
            this.firestoreListeners.clear();

            this.traces.clear();
            this.mfaResolver = null;
            this.phoneConfirmationResult = null;
        });
    }

    _setupRecaptchaContainer() { if (document.getElementById('recaptcha-container')) return; const c = document.createElement('div'); c.id = 'recaptcha-container'; document.body.appendChild(c);
    }

    getInfo() {
        return {
            id: 'ultimateFirebase',
            name: 'FirebaseAPI',
            color1: '#C0C0C0',
            blockIconURI: 'https://www.gstatic.com/mobilesdk/240501_mobilesdk/firebase_64dp.png', 
            blocks: [
                { opcode: 'loadAndConfigure', blockType: Scratch.BlockType.COMMAND, text: 'Подключить Firebase: URL [DB_URL] API ключ [API_KEY] ID проекта [PROJECT_ID]', arguments: { DB_URL: { type: Scratch.ArgumentType.STRING, defaultValue: 'https://project-id.firebaseio.com' }, API_KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'AIzaSy...' }, PROJECT_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'your-project-id' }}},
                '---',
                { blockType: Scratch.BlockType.LABEL, text: '🛠️ Инициализация' },
                { opcode: 'onFirebaseInitialized', blockType: Scratch.BlockType.HAT, text: 'Когда Firebase инициализирован', isEdgeActivated: false },
                { opcode: 'isFirebaseInitialized', blockType: Scratch.BlockType.BOOLEAN, text: 'Firebase инициализирован?' },
                { opcode: 'reinitializeFirebase', blockType: Scratch.BlockType.COMMAND, text: 'Перезапустить Firebase' },
                '---',
                { blockType: Scratch.BlockType.LABEL, text: 'Аутентификация и Профиль' },
                { opcode: 'setAuthPersistence', blockType: Scratch.BlockType.COMMAND, text: 'Сохранять вход [PERSISTENCE_TYPE]', arguments: { PERSISTENCE_TYPE: { type: Scratch.ArgumentType.STRING, menu: 'persistenceOptions' }}},
                { opcode: 'signUp', blockType: Scratch.BlockType.COMMAND, text: 'Зарегистрировать email [EMAIL] пароль [PASSWORD]', arguments: { EMAIL: { type: Scratch.ArgumentType.STRING }, PASSWORD: { type: Scratch.ArgumentType.STRING, inputType: Scratch.ArgumentType.PASSWORD }}},
                { opcode: 'signIn', blockType: Scratch.BlockType.COMMAND, text: 'Войти как email [EMAIL] пароль [PASSWORD]', arguments: { EMAIL: { type: Scratch.ArgumentType.STRING }, PASSWORD: { type: Scratch.ArgumentType.STRING, inputType: Scratch.ArgumentType.PASSWORD }}},
                { opcode: 'signInWithProvider', blockType: Scratch.BlockType.COMMAND, text: 'Войти с помощью [PROVIDER]', arguments: { PROVIDER: { type: Scratch.ArgumentType.STRING, menu: 'providers' }}},
                { opcode: 'signInWithToken', blockType: Scratch.BlockType.COMMAND, text: 'Войти по токену [TOKEN]', arguments: { TOKEN: { type: Scratch.ArgumentType.STRING, defaultValue: 'eyJhbGciOi...' }}},
                { opcode: 'signOut', blockType: Scratch.BlockType.COMMAND, text: 'Выйти из аккаунта'},
                { opcode: 'getCurrentUser', blockType: Scratch.BlockType.REPORTER, text: 'Данные текущего пользователя [FIELD]', arguments: { FIELD: { type: Scratch.ArgumentType.STRING, menu: 'userFields' } } },
                { opcode: 'getCurrentUserIDToken', blockType: Scratch.BlockType.REPORTER, text: 'ID токен текущего пользователя'},
                { opcode: 'isUserLoggedIn', blockType: Scratch.BlockType.BOOLEAN, text: 'Пользователь вошел в систему?' },
                { opcode: 'updateUserProfile', blockType: Scratch.BlockType.COMMAND, text: 'Обновить профиль: имя [NAME] URL фото [PHOTO_URL]', arguments: { NAME: { type: Scratch.ArgumentType.STRING }, PHOTO_URL: { type: Scratch.ArgumentType.STRING }}},
                { opcode: 'updateUserPassword', blockType: Scratch.BlockType.COMMAND, text: 'Изменить пароль на [NEW_PASSWORD]', arguments: { NEW_PASSWORD: { type: Scratch.ArgumentType.STRING, inputType: Scratch.ArgumentType.PASSWORD }}},
                
                { opcode: 'reauthenticateUser', blockType: Scratch.BlockType.COMMAND, text: 'Подтвердить пароль [PASSWORD] для безопасной операции', arguments: { PASSWORD: { type: Scratch.ArgumentType.STRING, inputType: Scratch.ArgumentType.PASSWORD }}},
                { opcode: 'deleteUser', blockType: Scratch.BlockType.COMMAND, text: 'Удалить аккаунт текущего пользователя' },

                '---',
                { blockType: Scratch.BlockType.LABEL, text: 'Управление Email и Телефоном' },
                { opcode: 'sendVerificationEmail', blockType: Scratch.BlockType.COMMAND, text: 'отправить письмо для верификации почты' },
                { opcode: 'sendPasswordReset', blockType: Scratch.BlockType.COMMAND, text: 'отправить письмо для сброса пароля на email [EMAIL]', arguments: { EMAIL: { type: Scratch.ArgumentType.STRING }}},
                { opcode: 'updateUserEmail', blockType: Scratch.BlockType.COMMAND, text: 'изменить email текущего пользователя на [NEW_EMAIL]', arguments: { NEW_EMAIL: { type: Scratch.ArgumentType.STRING }}},
                { opcode: 'sendVerificationCode', blockType: Scratch.BlockType.COMMAND, text: 'Отправить код на телефон [PHONE_NUMBER]', arguments: { PHONE_NUMBER: { type: Scratch.ArgumentType.STRING, defaultValue: '+12345678900' }}},
                { opcode: 'signInWithPhoneCode', blockType: Scratch.BlockType.COMMAND, text: 'Войти с помощью кода [CODE]', arguments: { CODE: { type: Scratch.ArgumentType.STRING }}},
                '---',
                { blockType: Scratch.BlockType.LABEL, text: 'Двухфакторная Аутентификация (MFA)' },
                { opcode: 'enrollMfa', blockType: Scratch.BlockType.COMMAND, text: 'Подключить 2FA для телефона [PHONE_NUMBER]', arguments: { PHONE_NUMBER: { type: Scratch.ArgumentType.STRING, defaultValue: '+12345678900' }}},
                { opcode: 'whenMfaRequired', blockType: Scratch.BlockType.HAT, text: 'Когда требуется второй фактор (2FA)', isEdgeActivated: false },
                { opcode: 'getMfaHint', blockType: Scratch.BlockType.REPORTER, text: 'Подсказка для второго фактора' },
                { opcode: 'completeSignInWithMfaCode', blockType: Scratch.BlockType.COMMAND, text: 'Завершить вход с 2FA кодом [CODE]', arguments: { CODE: { type: Scratch.ArgumentType.STRING }}},
                '---',
                { blockType: Scratch.BlockType.LABEL, text: '🗂️ Cloud Firestore (Документы)' },
                { opcode: 'firestoreAddDoc', blockType: Scratch.BlockType.REPORTER, text: 'добавить документ [DATA] в коллекцию [PATH]', arguments: { DATA: { type: Scratch.ArgumentType.STRING, defaultValue: '{"name":"Alex", "score":100}' }, PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'players' }}},
                { opcode: 'firestoreSetDoc', blockType: Scratch.BlockType.COMMAND, text: 'задать документ [DATA] по пути [PATH]', arguments: { DATA: { type: Scratch.ArgumentType.STRING, defaultValue: '{"level":5}' }, PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'players/some-id' }}},
                { opcode: 'firestoreGetDoc', blockType: Scratch.BlockType.REPORTER, text: 'прочитать документ по пути [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'players/some-id' }}},
                { opcode: 'firestoreDeleteDoc', blockType: Scratch.BlockType.COMMAND, text: 'удалить документ по пути [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'players/some-id' }}},

                '---',
                { blockType: Scratch.BlockType.LABEL, text: '🗂️ Firestore (Запросы и Слушатели)' },
                { opcode: 'firestoreQuery', blockType: Scratch.BlockType.COMMAND, text: 'Найти в [PATH] где [FIELD] [OP] [VALUE] сортировать [SORT_BY] [SORT_DIR] лимит [LIMIT]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'players' }, FIELD: { type: Scratch.ArgumentType.STRING, defaultValue: 'score' }, OP: { type: Scratch.ArgumentType.STRING, menu: 'firestoreOps' }, VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: '100' }, SORT_BY: { type: Scratch.ArgumentType.STRING, defaultValue: 'score' }, SORT_DIR: { type: Scratch.ArgumentType.STRING, menu: 'sortDir' }, LIMIT: { type: Scratch.ArgumentType.NUMBER } }},
                { opcode: 'firestoreQuerySync', blockType: Scratch.BlockType.REPORTER, text: 'Найти в [PATH] где [FIELD] [OP] [VALUE] сортировать [SORT_BY] [SORT_DIR] лимит [LIMIT] (результат)', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'players' }, FIELD: { type: Scratch.ArgumentType.STRING, defaultValue: 'score' }, OP: { type: Scratch.ArgumentType.STRING, menu: 'firestoreOps' }, VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: '100' }, SORT_BY: { type: Scratch.ArgumentType.STRING, defaultValue: 'score' }, SORT_DIR: { type: Scratch.ArgumentType.STRING, menu: 'sortDir' }, LIMIT: { type: Scratch.ArgumentType.NUMBER } }},
                { opcode: 'onFirestoreQuery', blockType: Scratch.BlockType.HAT, text: 'Когда запрос Firestore выполнен' },
                { opcode: 'getFirestoreQueryResult', blockType: Scratch.BlockType.REPORTER, text: 'результат запроса Firestore' },
                { opcode: 'listenForDoc', blockType: Scratch.BlockType.HAT, text: 'Когда документ [PATH] изменяется', isEdgeActivated: false, arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'players/player1' }}},
                { opcode: 'listenForCollection', blockType: Scratch.BlockType.HAT, text: 'Когда коллекция [PATH] изменяется', isEdgeActivated: false, arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'chat' }}},
                { opcode: 'getLastFirestoreData', blockType: Scratch.BlockType.REPORTER, text: 'последние данные из Firestore' },
                { opcode: 'firestoreStopAllListeners', blockType: Scratch.BlockType.COMMAND, text: 'остановить всех слушателей Firestore' },
                
                '---',
                { blockType: Scratch.BlockType.LABEL, text: '☁️ Cloud Storage' },
                { opcode: 'storageUploadText', blockType: Scratch.BlockType.COMMAND, text: 'загрузить текст [TEXT_DATA] в файл по пути [PATH]', arguments: { TEXT_DATA: { type: Scratch.ArgumentType.STRING, defaultValue: 'Hello World!' }, PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'saves/save1.txt' }}},
                { opcode: 'storageUploadDataURL', blockType: Scratch.BlockType.COMMAND, text: 'Загрузить Data URL [DATA_URL] как файл [PATH]', arguments: { DATA_URL: { type: Scratch.ArgumentType.STRING, defaultValue: 'data:image/png;base64,iVBORw0KG...' }, PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'images/myAvatar.png' }}},
                { opcode: 'storageGetURL', blockType: Scratch.BlockType.REPORTER, text: 'получить URL для скачивания файла [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'images/logo.png' }}},
                { opcode: 'storageDeleteFile', blockType: Scratch.BlockType.COMMAND, text: 'удалить файл по пути [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'saves/old_save.txt' }}},
                
                '---',
                { blockType: Scratch.BlockType.LABEL, text: '📊 Analytics' },
                { opcode: 'analyticsLogEvent', blockType: Scratch.BlockType.COMMAND, text: 'Записать событие [NAME] с данными [DATA]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'level_complete' }, DATA: { type: Scratch.ArgumentType.STRING, defaultValue: '{"level_name":"Level 1", "score": 100}' }}},
                { opcode: 'analyticsSetUserProperty', blockType: Scratch.BlockType.COMMAND, text: 'Установить свойство пользователя [KEY] в [VALUE]', arguments: { KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'favorite_character' }, VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: 'wizard' }}},
                
                '---',
                { blockType: Scratch.BlockType.LABEL, text: '⏱️ Мониторинг Производительности' },
                { opcode: 'perfStartTrace', blockType: Scratch.BlockType.COMMAND, text: 'Начать отслеживание [TRACE_NAME]', arguments: { TRACE_NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'load_level_1' }}},
                { opcode: 'perfStopTrace', blockType: Scratch.BlockType.COMMAND, text: 'Остановить отслеживание [TRACE_NAME]', arguments: { TRACE_NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'load_level_1' }}},

                '---',
                { blockType: Scratch.BlockType.LABEL, text: '⚙️ Remote Config' },
                { opcode: 'remoteConfigSetDefaults', blockType: Scratch.BlockType.COMMAND, text: 'Задать настройки по умолчанию [DEFAULTS]', arguments: { DEFAULTS: { type: Scratch.ArgumentType.STRING, defaultValue: '{"welcome_message":"Hello", "difficulty": 1}' }}},
                { opcode: 'remoteConfigFetch', blockType: Scratch.BlockType.COMMAND, text: 'Получить и активировать настройки с сервера' },
                { opcode: 'onRemoteConfigFetched', blockType: Scratch.BlockType.HAT, text: 'Когда настройки с сервера получены' },
                { opcode: 'remoteConfigGetValue', blockType: Scratch.BlockType.REPORTER, text: 'Получить настройку [KEY]', arguments: { KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'welcome_message' }}},

                '---',
                { blockType: Scratch.BlockType.LABEL, text: '🚀 Cloud Functions (Callable)' },
                { opcode: 'functionsCall', blockType: Scratch.BlockType.COMMAND, text: 'вызвать облачную функцию [NAME] с данными [DATA]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'processPayment' }, DATA: { type: Scratch.ArgumentType.STRING, defaultValue: '{"amount":100, "currency":"USD"}' }}},
                { opcode: 'getFunctionResultSync', blockType: Scratch.BlockType.REPORTER, text: 'результат вызова [NAME] с данными [DATA]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'processPayment' }, DATA: { type: Scratch.ArgumentType.STRING, defaultValue: '{"amount":100, "currency":"USD"}' }}},
                { opcode: 'onFunctionResult', blockType: Scratch.BlockType.HAT, text: 'когда облачная функция вернула ответ'},
                { opcode: 'getFunctionResult', blockType: Scratch.BlockType.REPORTER, text: 'последний ответ от функции' },
                
                '---',
                { blockType: Scratch.BlockType.LABEL, text: '🌐 HTTPS Функции (с Заголовками)' },
                // [ИЗМЕНЕНО] Добавлен аргумент HEADERS
                { opcode: 'httpsCallGet', blockType: Scratch.BlockType.COMMAND, text: 'HTTPS GET запрос на [ENDPOINT] (заголовки: [HEADERS])', arguments: { ENDPOINT: { type: Scratch.ArgumentType.STRING, defaultValue: 'helloWorld' }, HEADERS: { type: Scratch.ArgumentType.STRING, defaultValue: '{}' } } },
                { opcode: 'httpsCallPost', blockType: Scratch.BlockType.COMMAND, text: 'HTTPS POST запрос на [ENDPOINT] с данными [DATA] (заголовки: [HEADERS])', arguments: { ENDPOINT: { type: Scratch.ArgumentType.STRING, defaultValue: 'processData' }, DATA: { type: Scratch.ArgumentType.STRING, defaultValue: '{"key":"value"}' }, HEADERS: { type: Scratch.ArgumentType.STRING, defaultValue: '{}' } } },
                
                { opcode: 'httpsCallGetSync', blockType: Scratch.BlockType.REPORTER, text: 'результат HTTPS GET запроса на [ENDPOINT] (заголовки: [HEADERS])', arguments: { ENDPOINT: { type: Scratch.ArgumentType.STRING, defaultValue: 'helloWorld' }, HEADERS: { type: Scratch.ArgumentType.STRING, defaultValue: '{}' } } },
                { opcode: 'httpsCallPostSync', blockType: Scratch.BlockType.REPORTER, text: 'результат HTTPS POST запроса на [ENDPOINT] с данными [DATA] (заголовки: [HEADERS])', arguments: { ENDPOINT: { type: Scratch.ArgumentType.STRING, defaultValue: 'processData' }, DATA: { type: Scratch.ArgumentType.STRING, defaultValue: '{"key":"value"}' }, HEADERS: { type: Scratch.ArgumentType.STRING, defaultValue: '{}' } } },
                
                '---',
                { blockType: Scratch.BlockType.LABEL, text: 'База данных в реальном времени (Realtime DB)' },
                { opcode: 'writeData', blockType: Scratch.BlockType.COMMAND, text: 'Записать по пути [PATH] значение [VALUE]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'users/player1' }, VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: '{"score": 100}' }}},
                { opcode: 'rtdbAtomicAdd', blockType: Scratch.BlockType.COMMAND, text: 'Безопасно прибавить к [PATH] число [VALUE]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'users/player1/score' }, VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 10 }}},
                { opcode: 'deleteData', blockType: Scratch.BlockType.COMMAND, text: 'Удалить данные по пути [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'users/player1/temp' }}},
                { opcode: 'setOnDisconnect', blockType: Scratch.BlockType.COMMAND, text: 'При отключении установить по пути [PATH] значение [VALUE]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'users/player1/online' }, VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: 'false' }}},
                { opcode: 'removeOnDisconnect', blockType: Scratch.BlockType.COMMAND, text: 'При отключении удалить путь [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'users/player1/temp_presence' }}},
                { opcode: 'cancelOnDisconnect', blockType: Scratch.BlockType.COMMAND, text: 'Отменить команду при отключении для пути [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'users/player1/online' }}},
                { opcode: 'readData', blockType: Scratch.BlockType.REPORTER, text: 'прочитать данные по пути [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'users/player1/score' }}},
                { opcode: 'listenForData', blockType: Scratch.BlockType.HAT, text: 'Когда данные по пути [PATH] изменяются', isEdgeActivated: false, arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'chats/main' }}},
                { opcode: 'getLastReceivedData', blockType: Scratch.BlockType.REPORTER, text: 'Последние полученные данные (RTDB)'},
                
                '---',
                { blockType: Scratch.BlockType.LABEL, text: 'RTDB (Запросы для списков лидеров)' },
                { opcode: 'rtdbQuery', blockType: Scratch.BlockType.COMMAND, text: 'Найти в RTDB [PATH] сортировать по [SORT_BY] взять [LIMIT_TYPE] [LIMIT] шт', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'scores' }, SORT_BY: { type: Scratch.ArgumentType.STRING, defaultValue: 'score' }, LIMIT_TYPE: { type: Scratch.ArgumentType.STRING, menu: 'limitType' }, LIMIT: { type: Scratch.ArgumentType.NUMBER, defaultValue: 10 } }},
                { opcode: 'rtdbQuerySync', blockType: Scratch.BlockType.REPORTER, text: 'Найти в RTDB [PATH] сортировать по [SORT_BY] взять [LIMIT_TYPE] [LIMIT] шт (результат)', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'scores' }, SORT_BY: { type: Scratch.ArgumentType.STRING, defaultValue: 'score' }, LIMIT_TYPE: { type: Scratch.ArgumentType.STRING, menu: 'limitType' }, LIMIT: { type: Scratch.ArgumentType.NUMBER, defaultValue: 10 } }},
                { opcode: 'onRtdbQuery', blockType: Scratch.BlockType.HAT, text: 'Когда запрос RTDB выполнен' },
                { opcode: 'getRtdbQueryResult', blockType: Scratch.BlockType.REPORTER, text: 'результат запроса RTDB' },
                
                '---',
                { blockType: Scratch.BlockType.LABEL, text: 'Обработка Ошибок' },
                { opcode: 'onAuthError', blockType: Scratch.BlockType.HAT, text: 'Когда произошла ошибка аутентификации'},
                { opcode: 'onDbError', blockType: Scratch.BlockType.HAT, text: 'Когда произошла ошибка базы данных'},
                { opcode: 'getLastError', blockType: Scratch.BlockType.REPORTER, text: 'последняя ошибка' },
                { opcode: 'clearLastError', blockType: Scratch.BlockType.COMMAND, text: 'очистить последнюю ошибку'},
            ],
            menus: {
                persistenceOptions: { acceptReporters: true, items: ['Навсегда (по умолчанию)', 'На одну сессию'] },
                providers: { acceptReporters: true, items: ['Google', 'Microsoft', 'GitHub', 'Apple', 'Anonymous'] },
                userFields: { acceptReporters: true, items: ['Email', 'UID', 'Display Name', 'Phone Number', 'Photo URL', 'Почта подтверждена?'] },
                firestoreOps: { acceptReporters: true, items: ['==', '!=', '<', '<=', '>', '>=', 'array-contains'] },
                sortDir: { acceptReporters: true, items: ['по убыванию', 'по возрастанию'] },
                limitType: { acceptReporters: true, items: ['первые', 'последние'] }
            }
        };
    }
    
    _handleError(error, type) { 
        console.error(`Firebase Error (${type}):`, error); 
        this.lastErrorMessage = error.message; 
        switch(type) { 
            case 'auth': this.runtime.startHats('ultimateFirebase_onAuthError'); break; 
            case 'db': this.runtime.startHats('ultimateFirebase_onDbError'); break; 
            case 'mfa': this.runtime.startHats('ultimateFirebase_onMfaError'); break; 
            case 'firestore': 
            case 'storage': 
            case 'functions': 
            case 'analytics':
            case 'remoteConfig':
            case 'performance': 
                this.runtime.startHats('ultimateFirebase_onDbError');
                break; 
        } 
    }

    _isReady(service) { if (!this.firebase) { this._handleError({ message: 'Firebase не инициализирован!' }, 'auth'); return false; } if (service && !this[service]) { this._handleError({ message: `Сервис ${service} не доступен.` }, 'auth'); return false; } return true; }
    _parseValue(value) { try { return JSON.parse(value); } catch (e) { return value; } }
    
    async _initialize(config) {
        this.isInitialized = false; 
        
        const loadScript = src => new Promise((resolve, reject) => { 
            if (document.querySelector(`script[src="${src}"]`)) return resolve(); 
            const s = document.createElement('script'); 
            s.src = src; 
            s.onload = resolve; 
            s.onerror = () => reject(`Ошибка загрузки скрипта: ${src}`); 
            document.head.appendChild(s); 
        }); 
        
        await Promise.all([ 
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"), 
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"), 
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"), 
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"), 
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-storage.js"), 
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-functions.js"),
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-analytics.js"), 
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-remote-config.js"),
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-performance.js")
        ]);

        if (window.firebase.apps.length) { 
            this.firebase = window.firebase.app(); 
        } else { 
            this.firebase = window.firebase.initializeApp(config); 
        } 

        this.auth = firebase.auth(); 
        this.db = firebase.database(); 
        this.firestore = firebase.firestore(); 
        this.storage = firebase.storage(); 
        this.functions = firebase.functions(); 
        this.analytics = firebase.analytics();
        this.remoteConfig = firebase.remoteConfig();
        this.performance = firebase.performance(); 
        
        this.remoteConfig.settings = {
            minimumFetchIntervalMillis: 3600000,
            fetchTimeoutMillis: 60000 
        };
        this.remoteConfig.defaultConfig = {};

        this.auth.onAuthStateChanged(user => { this.currentUser = user; }); 
        
        try { 
            window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', { 'size': 'invisible' }); 
        } catch (e) { 
            console.warn("Recaptcha Verifier не удалось инициализировать. Вход по телефону может не работать."); 
        } 

        this.isInitialized = true; 
        this.runtime.startHats('ultimateFirebase_onFirebaseInitialized');
        console.log("Firebase Full Suite SDK загружен и настроен."); 
    }
    
    loadAndConfigure(args) { 
        this._setupRecaptchaContainer(); 
        const firebaseConfig = { 
            apiKey: args.API_KEY, 
            authDomain: `${args.PROJECT_ID}.firebaseapp.com`, 
            projectId: args.PROJECT_ID, 
            databaseURL: args.DB_URL, 
            storageBucket: `${args.PROJECT_ID}.appspot.com`,
            appId: `1:${args.PROJECT_ID}:web:`, 
            measurementId: `G-`
        }; 

        return this._initialize(firebaseConfig).catch(error => this._handleError(error, 'auth'));
    }
    
    reinitializeFirebase(args) {
        if (this.firebase) {
            this.runtime.emit('PROJECT_STOP_ALL');
            try {
                this.firebase.delete();
            } catch(e) {
                console.warn('Не удалось удалить старое приложение Firebase:', e);
            }
            this.firebase = null;
        }
        this._handleError({ message: 'Для повторной инициализации используйте блок "Подключить Firebase..."' }, 'auth');
    }

    isFirebaseInitialized() { return this.isInitialized; }
    onFirebaseInitialized() { return false; }
    onAuthError() { return false; }
    onDbError() { return false; }
    onMfaError() { return false; }
    getLastError() { return this.lastErrorMessage; }
    clearLastError() { this.lastErrorMessage = ''; }
    
    // ... Auth ...
    setAuthPersistence(args) { if (!this._isReady('auth')) return; this.persistenceType = (args.PERSISTENCE_TYPE === 'Навсегда (по умолчанию)') ? 'local' : 'session'; }
    _getPersistence() { return this.persistenceType === 'local' ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION; }
    
    signUp(args) { if (!this._isReady('auth')) return; return this.auth.setPersistence(this._getPersistence()).then(() => this.auth.createUserWithEmailAndPassword(args.EMAIL, args.PASSWORD)).catch(error => this._handleError(error, 'auth')); }
    signIn(args) { if (!this._isReady('auth')) return; return this.auth.setPersistence(this._getPersistence()).then(() => this.auth.signInWithEmailAndPassword(args.EMAIL, args.PASSWORD)).catch(error => { if (error.code === 'auth/multi-factor-required') { this.mfaResolver = error.resolver; this.runtime.startHats('ultimateFirebase_whenMfaRequired'); } else { this._handleError(error, 'auth'); } }); }
    signInWithProvider(args) { if (!this._isReady('auth')) return; return this.auth.setPersistence(this._getPersistence()).then(() => { if (args.PROVIDER === 'Anonymous') { return this.auth.signInAnonymously(); } let p; switch (args.PROVIDER) { case 'Google': p = new firebase.auth.GoogleAuthProvider(); break; case 'Microsoft': p = new firebase.auth.OAuthProvider('microsoft.com'); break; case 'GitHub': p = new firebase.auth.GithubAuthProvider(); break; case 'Apple': p = new firebase.auth.OAuthProvider('apple.com'); break; default: return Promise.reject("Неизвестный провайдер"); } return this.auth.signInWithPopup(p); }).catch(error => this._handleError(error, 'auth')); }
    signInWithToken(args) { if (!this._isReady('auth')) return; return this.auth.setPersistence(this._getPersistence()).then(() => this.auth.signInWithCustomToken(args.TOKEN)).catch(error => this._handleError(error, 'auth')); }
    signOut() { if (!this._isReady('auth')) return; return this.auth.signOut(); }
    isUserLoggedIn() { return !!this.currentUser; }
    getCurrentUser(args) { if (!this.currentUser) return ''; switch(args.FIELD) { case 'Email': return this.currentUser.email; case 'UID': return this.currentUser.uid; case 'Display Name': return this.currentUser.displayName; case 'Phone Number': return this.currentUser.phoneNumber; case 'Photo URL': return this.currentUser.photoURL; case 'Почта подтверждена?': return this.currentUser.emailVerified; default: return ''; } }
    getCurrentUserIDToken() { if (!this.currentUser) return Promise.resolve(''); return this.currentUser.getIdToken(true).catch(e => { this._handleError(e, 'auth'); return ''; }); }
    updateUserProfile(args) { if (!this.currentUser) return this._handleError({message:'Пользователь не вошел'},'auth'); return this.currentUser.updateProfile({ displayName: args.NAME, photoURL: args.PHOTO_URL }).catch(e => this._handleError(e, 'auth')); }
    updateUserPassword(args) { if (!this.currentUser) return this._handleError({message:'Пользователь не вошел'},'auth'); return this.currentUser.updatePassword(args.NEW_PASSWORD).catch(e => this._handleError(e, 'auth')); }
    sendVerificationEmail() { if (!this.currentUser) return this._handleError({message:'Пользователь не вошел'},'auth'); return this.currentUser.sendEmailVerification().catch(e => this._handleError(e, 'auth')); }
    sendPasswordReset(args) { if (!this._isReady('auth')) return; return this.auth.sendPasswordResetEmail(args.EMAIL).catch(e => this._handleError(e, 'auth')); }
    updateUserEmail(args) { if (!this.currentUser) return this._handleError({message:'Пользователь не вошел'},'auth'); return this.currentUser.updateEmail(args.NEW_EMAIL).catch(e => this._handleError(e, 'auth')); }
    
    reauthenticateUser(args) {
        if (!this.currentUser) return this._handleError({message:'Пользователь не вошел'},'auth');
        const credential = firebase.auth.EmailAuthProvider.credential(this.currentUser.email, args.PASSWORD);
        return this.currentUser.reauthenticateWithCredential(credential)
            .catch(e => this._handleError(e, 'auth'));
    }
    
    deleteUser() {
        if (!this.currentUser) return this._handleError({message:'Пользователь не вошел'},'auth');
        return this.currentUser.delete()
            .then(() => { this.currentUser = null; })
            .catch(e => {
                if (e.code === 'auth/requires-recent-login') {
                    this._handleError({message: 'Требуется недавний вход! Сначала используйте блок "Подтвердить пароль".'}, 'auth');
                } else {
                    this._handleError(e, 'auth');
                }
            });
    }

    sendVerificationCode(args) { if (!this._isReady('auth')) return; const appVerifier = window.recaptchaVerifier; return this.auth.signInWithPhoneNumber(args.PHONE_NUMBER, appVerifier).then(confirmationResult => { this.phoneConfirmationResult = confirmationResult; }).catch(error => this._handleError(error, 'auth')); }
    signInWithPhoneCode(args) { if (!this.phoneConfirmationResult) { this._handleError({ message: 'Сначала отправьте код подтверждения!' }, 'auth'); return; } return this.phoneConfirmationResult.confirm(args.CODE).catch(error => this._handleError(error, 'auth')); }
    enrollMfa(args) { if (!this.currentUser) { this._handleError({ message: 'Для подключения 2FA нужно войти в аккаунт.' }, 'mfa'); return; } const appVerifier = window.recaptchaVerifier; const phoneInfoOptions = { phoneNumber: args.PHONE_NUMBER, session: this.currentUser.multiFactor.session }; const phoneAuthProvider = new firebase.auth.PhoneAuthProvider(); return phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, appVerifier).then(verificationId => { const code = prompt('Введите код из СМС для подключения 2FA:'); if (!code) return; const assertion = firebase.auth.PhoneMultiFactorGenerator.assertion(verificationId, code); return this.currentUser.multiFactor.enroll(assertion, `My Phone`); }).catch(error => this._handleError(error, 'mfa')); }
    whenMfaRequired() { return false; }
    getMfaHint() { if (!this.mfaResolver) return ''; return this.mfaResolver.hints[0].displayName || this.mfaResolver.hints[0].phoneNumber; }
    completeSignInWithMfaCode(args) { if (!this.mfaResolver) return; const cred = firebase.auth.PhoneMultiFactorGenerator.assertion( this.mfaResolver.hints[0].verificationId, args.CODE ); return this.mfaResolver.resolveSignIn(cred).then(() => { this.mfaResolver = null; }).catch(error => this._handleError(error, 'mfa')); }
    
    // --- Firestore (Документы) ---
    firestoreAddDoc(args) { if (!this._isReady('firestore')) return Promise.resolve(''); return this.firestore.collection(args.PATH).add(this._parseValue(args.DATA)).then(docRef => docRef.id).catch(e => { this._handleError(e, 'firestore'); return ''; }); }
    firestoreSetDoc(args) { if (!this._isReady('firestore')) return; const docPath = args.PATH.split('/'); const docId = docPath.pop(); const colPath = docPath.join('/'); return this.firestore.collection(colPath).doc(docId).set(this._parseValue(args.DATA), { merge: true }).catch(e => this._handleError(e, 'firestore')); }
    firestoreGetDoc(args) { if (!this._isReady('firestore')) return Promise.resolve(''); return this.firestore.doc(args.PATH).get().then(doc => doc.exists ? JSON.stringify(doc.data()) : '').catch(e => { this._handleError(e, 'firestore'); return ''; }); }
    firestoreDeleteDoc(args) { if (!this._isReady('firestore')) return; return this.firestore.doc(args.PATH).delete().catch(e => this._handleError(e, 'firestore')); }
    
    _formatFirestoreSnapshot(snapshot) {
        if (!snapshot.exists && !snapshot.docs) return '';
        if (snapshot.exists) { return JSON.stringify(snapshot.data()); }
        const docs = [];
        snapshot.forEach(doc => { docs.push({ id: doc.id, ...doc.data() }); });
        return JSON.stringify(docs);
    }
    
    _executeFirestoreQuery(args) {
        if (!this._isReady('firestore')) return Promise.resolve('[]');
        let query = this.firestore.collection(args.PATH);
        if (args.FIELD) { query = query.where(args.FIELD, args.OP, this._parseValue(args.VALUE)); }
        if (args.SORT_BY) { query = query.orderBy(args.SORT_BY, args.SORT_DIR === 'по убыванию' ? 'desc' : 'asc'); }
        if (args.LIMIT && Number(args.LIMIT) > 0) { query = query.limit(Number(args.LIMIT)); }
        return query.get().then(querySnapshot => this._formatFirestoreSnapshot(querySnapshot)).catch(e => { this._handleError(e, 'firestore'); return '[]'; });
    }

    firestoreQuery(args) {
        return this._executeFirestoreQuery(args).then(result => {
            this.lastFirestoreQueryResult = result;
            this.runtime.startHats('ultimateFirebase_onFirestoreQuery');
        });
    }

    firestoreQuerySync(args) { return this._executeFirestoreQuery(args); }

    onFirestoreQuery() { return false; }
    getFirestoreQueryResult() { return this.lastFirestoreQueryResult; }

    // [ИСПРАВЛЕНО] Исправлена логика слушателя: не пересоздаем, если уже есть.
    listenForDoc(args) {
        if (!this._isReady('firestore')) return false;
        const path = args.PATH;
        
        // Если уже слушаем этот путь, ничего не делаем, слушатель работает в фоне
        if (this.firestoreListeners.has(path)) return false;

        const unsubscribe = this.firestore.doc(path).onSnapshot(doc => {
            this.lastFirestoreData = this._formatFirestoreSnapshot(doc);
            this.runtime.startHats('ultimateFirebase_listenForDoc', { PATH: path });
        }, error => this._handleError(error, 'firestore'));
        
        this.firestoreListeners.set(path, unsubscribe);
        return false;
    }

    // [ИСПРАВЛЕНО] То же самое для коллекций
    listenForCollection(args) {
        if (!this._isReady('firestore')) return false;
        const path = args.PATH;
        
        if (this.firestoreListeners.has(path)) return false;

        const unsubscribe = this.firestore.collection(path).onSnapshot(querySnapshot => {
            this.lastFirestoreData = this._formatFirestoreSnapshot(querySnapshot);
            this.runtime.startHats('ultimateFirebase_listenForCollection', { PATH: path });
        }, error => this._handleError(error, 'firestore'));
        
        this.firestoreListeners.set(path, unsubscribe);
        return false;
    }

    getLastFirestoreData() { return this.lastFirestoreData; }
    firestoreStopAllListeners() { this.firestoreListeners.forEach(unsubscribe => unsubscribe()); this.firestoreListeners.clear(); console.log('Все слушатели Firestore остановлены.'); }
    
    // --- Cloud Storage ---
    storageUploadText(args) { if (!this._isReady('storage')) return; return this.storage.ref(args.PATH).putString(args.TEXT_DATA).catch(e => this._handleError(e, 'storage')); }
    storageUploadDataURL(args) { if (!this._isReady('storage')) return; return this.storage.ref(args.PATH).putString(args.DATA_URL, 'data_url').catch(e => this._handleError(e, 'storage')); }
    storageGetURL(args) { if (!this._isReady('storage')) return Promise.resolve(''); return this.storage.ref(args.PATH).getDownloadURL().catch(e => { this._handleError(e, 'storage'); return ''; }); }
    storageDeleteFile(args) { if (!this._isReady('storage')) return; return this.storage.ref(args.PATH).delete().catch(e => this._handleError(e, 'storage')); }
    
    // --- Analytics ---
    analyticsLogEvent(args) { if (!this._isReady('analytics')) return; try { const data = this._parseValue(args.DATA); this.analytics.logEvent(args.NAME, data); } catch (e) { this._handleError(e, 'analytics'); } }
    analyticsSetUserProperty(args) { if (!this._isReady('analytics')) return; try { this.analytics.setUserProperties({ [args.KEY]: args.VALUE }); } catch (e) { this._handleError(e, 'analytics'); } }

    // --- Performance ---
    perfStartTrace(args) { if (!this._isReady('performance')) return; const traceName = args.TRACE_NAME; if (this.traces.has(traceName)) return; const trace = this.performance.trace(traceName); trace.start(); this.traces.set(traceName, trace); }
    perfStopTrace(args) { if (!this._isReady('performance')) return; const traceName = args.TRACE_NAME; if (!this.traces.has(traceName)) return; const trace = this.traces.get(traceName); trace.stop(); this.traces.delete(traceName); }

    // --- Remote Config ---
    remoteConfigSetDefaults(args) { if (!this._isReady('remoteConfig')) return; try { this.remoteConfig.defaultConfig = this._parseValue(args.DEFAULTS); } catch (e) { this._handleError(e, 'remoteConfig'); } }
    remoteConfigFetch() { if (!this._isReady('remoteConfig')) return; return this.remoteConfig.fetchAndActivate().then(() => { this.runtime.startHats('ultimateFirebase_onRemoteConfigFetched'); }).catch(e => this._handleError(e, 'remoteConfig')); }
    onRemoteConfigFetched() { return false; }
    remoteConfigGetValue(args) { if (!this._isReady('remoteConfig')) return ''; return this.remoteConfig.getValue(args.KEY).asString(); }

    // --- Cloud Functions ---
    _executeFunctionsCall(args) {
        if (!this._isReady('functions')) return Promise.resolve('{}');
        const callable = this.functions.httpsCallable(args.NAME); 
        return callable(this._parseValue(args.DATA))
            .then(result => JSON.stringify(result.data))
            .catch(e => { this._handleError(e, 'functions'); return '{}'; });
    }
    functionsCall(args) { 
        return this._executeFunctionsCall(args).then(result => {
            this.lastFunctionResult = result;
            this.runtime.startHats('ultimateFirebase_onFunctionResult');
        });
    }
    getFunctionResultSync(args) { return this._executeFunctionsCall(args); }
    onFunctionResult() { return false; }
    getFunctionResult() { return this.lastFunctionResult; }

    _getHttpsFunctionUrl(endpoint) { if (!this.firebase || !this.firebase.options.projectId) { this._handleError({ message: 'Firebase не настроен или отсутствует ID проекта.' }, 'functions'); return null; } const projectId = this.firebase.options.projectId; return `https://us-central1-${projectId}.cloudfunctions.net/${endpoint}`; }

    // [ИЗМЕНЕНО] Добавлена поддержка заголовков
    _executeHttpsCallGet(args) {
        if (!this._isReady('functions')) return Promise.resolve('{}');
        const url = this._getHttpsFunctionUrl(args.ENDPOINT);
        if (!url) return Promise.resolve('{}');
        
        const headers = {
            'Content-Type': 'application/json',
            ...this._parseValue(args.HEADERS) // Слияние пользовательских заголовков
        };

        return fetch(url, { method: 'GET', headers: headers })
            .then(response => { if (!response.ok) { throw new Error(`HTTP ошибка! Статус: ${response.status}`); } return response.json(); })
            .then(data => JSON.stringify(data))
            .catch(e => { this._handleError(e, 'functions'); return '{"error":"true", "message":"HTTP error"}'; });
    }

    // [ИЗМЕНЕНО] Добавлена поддержка заголовков
    _executeHttpsCallPost(args) {
        if (!this._isReady('functions')) return Promise.resolve('{}');
        const url = this._getHttpsFunctionUrl(args.ENDPOINT);
        if (!url) return Promise.resolve('{}');
        const postData = this._parseValue(args.DATA);
        
        const headers = {
            'Content-Type': 'application/json',
            ...this._parseValue(args.HEADERS)
        };
        
        return fetch(url, { 
            method: 'POST', 
            headers: headers, 
            body: JSON.stringify(postData), 
        })
        .then(response => { if (!response.ok) { throw new Error(`HTTP ошибка! Статус: ${response.status}`); } return response.json(); })
        .then(data => JSON.stringify(data))
        .catch(e => { this._handleError(e, 'functions'); return '{"error":"true", "message":"HTTP error"}'; });
    }

    httpsCallGet(args) {
        return this._executeHttpsCallGet(args).then(result => {
            this.lastFunctionResult = result;
            this.runtime.startHats('ultimateFirebase_onFunctionResult');
        });
    }
    httpsCallPost(args) {
        return this._executeHttpsCallPost(args).then(result => {
            this.lastFunctionResult = result;
            this.runtime.startHats('ultimateFirebase_onFunctionResult');
        });
    }

    httpsCallGetSync(args) { return this._executeHttpsCallGet(args); }
    httpsCallPostSync(args) { return this._executeHttpsCallPost(args); }

    // --- Realtime Database (RTDB) ---
    writeData(args) { if (!this._isReady('db')) return; return this.db.ref(args.PATH).set(this._parseValue(args.VALUE)).catch(error => this._handleError(error, 'db')); }
    rtdbAtomicAdd(args) { if (!this._isReady('db')) return; const value = Number(args.VALUE) || 0; return this.db.ref(args.PATH).set(firebase.database.ServerValue.increment(value)).catch(error => this._handleError(error, 'db')); }
    deleteData(args) { if (!this._isReady('db')) return; return this.db.ref(args.PATH).remove().catch(error => this._handleError(error, 'db')); }
    setOnDisconnect(args) { if (!this._isReady('db')) return; const ref = this.db.ref(args.PATH); ref.onDisconnect().cancel(); return ref.onDisconnect().set(this._parseValue(args.VALUE)).catch(error => this._handleError(error, 'db')); }
    removeOnDisconnect(args) { if (!this._isReady('db')) return; const ref = this.db.ref(args.PATH); ref.onDisconnect().cancel(); return ref.onDisconnect().remove().catch(error => this._handleError(error, 'db')); }
    cancelOnDisconnect(args) {if (!this._isReady('db')) return;return this.db.ref(args.PATH).onDisconnect().cancel().catch(error => this._handleError(error, 'db'));}
    readData(args) { if (!this._isReady('db')) return Promise.resolve(''); return this.db.ref(args.PATH).get().then(snapshot => { if (!snapshot.exists()) { return ''; } const data = snapshot.val(); if (typeof data === 'object' && data !== null) { return JSON.stringify(data); } return data; }).catch(error => { this._handleError(error, 'db'); return 'ОШИБКА'; }); }
    
    // [ИСПРАВЛЕНО] Логика слушателя RTDB
    listenForData(args) { 
        if (!this._isReady('db')) return false; 
        const path = args.PATH; 
        
        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Если слушатель уже есть, не удаляем его!
        // Блок HAT вызывается каждый кадр, поэтому мы просто возвращаем false, 
        // пока слушатель делает свою работу в фоне.
        if (this.dbListeners.has(path)) {
            return false;
        }

        // Регистрируем слушатель только один раз
        const listener = snapshot => { 
            const data = snapshot.val(); 
            this.lastReceivedData = (typeof data === 'object' && data !== null) ? JSON.stringify(data) : data; 
            this.runtime.startHats('ultimateFirebase_listenForData', { PATH: path }); 
        };
        
        this.db.ref(path).on('value', listener, error => this._handleError(error, 'db')); 
        this.dbListeners.set(path, listener); 
        return false; 
    }

    getLastReceivedData() { return this.lastReceivedData; }
    
    _executeRtdbQuery(args) {
        if (!this._isReady('db')) return Promise.resolve('[]');
        let query = this.db.ref(args.PATH);
        const sortBy = args.SORT_BY || null;
        if (sortBy) { query = query.orderByChild(sortBy); } else { query = query.orderByKey(); }
        const limit = Number(args.LIMIT) || 10;
        if (args.LIMIT_TYPE === 'первые') { query = query.limitToFirst(limit); } else { query = query.limitToLast(limit); }
        return query.get().then(snapshot => {
            if (!snapshot.exists()) { return '[]'; }
            const results = [];
            snapshot.forEach(child => {
                const childVal = child.val();
                results.push({ key: child.key, ...(typeof childVal === 'object' && childVal !== null ? childVal : { value: childVal }) });
            });
            return JSON.stringify(results);
        }).catch(e => { this._handleError(e, 'db'); return '[]'; });
    }

    rtdbQuery(args) {
        return this._executeRtdbQuery(args).then(result => {
            this.lastRtdbQueryResult = result;
            this.runtime.startHats('ultimateFirebase_onRtdbQuery');
        });
    }

    rtdbQuerySync(args) { return this._executeRtdbQuery(args); }
    onRtdbQuery() { return false; }
    getRtdbQueryResult() { return this.lastRtdbQueryResult; }
}

Scratch.extensions.register(new UltimateFirebaseExtension(Scratch.vm.runtime));
// [КОНЕЦ КОДА]
