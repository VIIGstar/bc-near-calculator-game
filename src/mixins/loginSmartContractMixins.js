import * as nearAPI from "near-api-js";
import getConfig from "./../config";
const nearConfig = getConfig(process.env.NODE_ENV || "development");


const RecentMethodCalledKey = 'recentMethodCalled'

export const SmartContractMixins = {
    data() {
        return {
            changeMethods: ['grant_access', 'revoke_access', 'get_reward', 'save_new_score']
        }
    },
    methods: {
        async signInWallet() {
            window.near = await nearAPI.connect({
                deps: {
                    keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore()
                },
                ...nearConfig
            });

            // Needed to access wallet login
            const walletConnection = new nearAPI.WalletConnection(window.near);
            if (!walletConnection.isSignedIn()) {
                await walletConnection.requestSignIn()
            }
            window.walletConnection = walletConnection
            const contract = await new nearAPI.Contract(window.walletConnection.account(), nearConfig.contractName, {
                // View methods are read-only – they don't modify the state, but usually return some value
                viewMethods: ['check_access', 'get_list_user', 'get_top_players'],
                // Change methods can modify the state, but you don't receive the returned value when called
                changeMethods: this.changeMethods,
                // Sender is the account ID to initialize transactions.
                // getAccountId() will return empty string if user is still unauthorized
                sender: window.walletConnection.getAccountId()
            });

            const ctx = this
            const handler = {
                get(_, prop) {
                    if (ctx.changeMethods.includes(prop)) {
                        localStorage.setItem(RecentMethodCalledKey, prop)
                    }
                    return Reflect.get(...arguments)
                }
            }

            // Initializing our contract APIs by contract name and configuration.
            window.contract = new Proxy(contract, handler)

            this.loaded = true
        },
        async checkPreviousTransaction() {
            const fn = localStorage.getItem(RecentMethodCalledKey)
            if (!fn) {
                this.removeInitializedData()
                return
            }
            const queries = new URL(location.href).searchParams;
            const hashTx = queries.get('transactionHashes')
            switch (queries.get('errorCode')) {
                case 'userRejected':
                    alert('User rejected transaction')
                    break
                case null: // check hash transaction + response
                    if (fn === 'save_new_score') {
                        alert('Game saved!')
                    }
                    console.log('get hash: ' , hashTx)
                    break
                default:
                    alert('Transaction got failed')
            }

            this.removeInitializedData()
        },
        removeInitializedData() {
            localStorage.removeItem(RecentMethodCalledKey)
            const emptyURL = new URL(location.href)
            window.history.pushState({}, document.title, `${emptyURL.origin}${emptyURL.pathname}`)
        }
    },
}