import { networkName } from '../../../utilities'
import { CommonWalletOptions, WalletModule, Helpers } from '../../../interfaces'

import universalLoginIcon from '../wallet-icons/icon-universal-login'

function universalLogin(options: CommonWalletOptions): WalletModule {
  const { networkId, preferred, label, iconSrc, svg } = options

  return {
    name: label || 'Universal Login',
    svg: svg || universalLoginIcon,
    iconSrc,
    wallet: async (helpers: Helpers) => {
      const { ULWeb3Provider } = await import('@universal-login/web3')

      const provider = ULWeb3Provider.getDefaultProvider(networkName(networkId))
      console.log({ provider })
      const { BigNumber } = helpers

      const getAddress = (): Promise<string | null> => {
        return new Promise((resolve, reject) => {
          let [address] = provider.getAccounts()
          if (!address) {
            provider.send(
              {
                method: 'eth_accounts',
                params: [],
                id: 42
              },
              (e: any, res: { result: string }) => {
                if (e) reject(e.message)
                address = res && res.result && res.result[0]
                address ? resolve(address) : resolve(null)
              }
            )
          } else {
            resolve(address)
          }
        })
      }

      return {
        provider,
        interface: {
          name: 'Universal Login',
          connect: () => provider.create(),
          disconnect: () => provider.finalizeAndStop(),
          address: {
            get: () => getAddress()
          },
          network: {
            get: () => Promise.resolve(networkId)
          },
          balance: {
            get: async () => {
              const address = await getAddress()
              if (!address) return null

              return new Promise((resolve, reject) => {
                provider.send(
                  {
                    method: 'eth_getBalance',
                    params: [address, 'latest'],
                    id: 42
                  },
                  (e: any, res: any) => {
                    if (e) reject(e.message)
                    resolve(BigNumber(res.result).toString(10))
                  }
                )
              })
            }
          }
        }
      }
    },
    desktop: true,
    mobile: true,
    preferred
  }
}

export default universalLogin
