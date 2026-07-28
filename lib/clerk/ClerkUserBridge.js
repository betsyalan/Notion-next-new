import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'

/**
 * Clerk 用户态桥接组件
 * 仅在启用 Clerk(NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)时由 lib/global.js
 * 通过 next/dynamic 按需加载,避免 @clerk/nextjs 打进全站共享 bundle。
 * 把 useUser() 的状态回传给 GlobalContextProvider。
 */
export default function ClerkUserBridge({ onChange }) {
  const { isLoaded, isSignedIn, user } = useUser()
  useEffect(() => {
    onChange({ isLoaded, isSignedIn, user })
  }, [isLoaded, isSignedIn, user, onChange])
  return null
}
