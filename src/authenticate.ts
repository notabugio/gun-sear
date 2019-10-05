import { work } from './work'
import { decrypt } from './decrypt'

const DEFAULT_OPTS = {}

export async function authenticateIdentity(
  chaingun: any,
  soul: string,
  password: string,
  encoding = 'base64'
) {
  const ident = await chaingun.get(soul).then()
  if (!ident || !ident.auth) return

  let decrypted: any
  try {
    const proof = await work(password, ident.auth.s, { encode: encoding })
    decrypted = await decrypt(ident.auth.ek, proof, {
      encode: encoding
    })
  } catch (err) {
    console.log('Attempting UTF8 login')
    const proof = await work(password, ident.auth.s, { encode: 'utf8' })
    decrypted = await decrypt(ident.auth.ek, proof, {
      encode: encoding
    })
  }

  if (!decrypted) return
  return {
    alias: ident.alias as string,
    pub: ident.pub as string,
    epub: ident.epub as string,
    priv: decrypted.priv as string,
    epriv: decrypted.epriv as string
  }
}

export async function authenticate(
  chaingun: any,
  alias: string,
  password: string,
  opt = DEFAULT_OPTS
) {
  const aliasSoul = `~@${alias}`
  const idents = await chaingun.get(aliasSoul).then()
  for (let soul in idents || {}) {
    if (soul === '_') continue
    let pair
    try {
      pair = await authenticateIdentity(chaingun, soul, password)
    } catch (e) {
      console.warn(e.stack || e)
    }
    if (pair) return pair
  }

  throw new Error('Wrong alias or password.')
}
