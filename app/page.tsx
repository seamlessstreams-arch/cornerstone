import { redirect } from 'next/navigation'

export default function Home() {
  redirect(process.env.NODE_ENV === 'production' ? '/dashboard' : '/registered-manager')
}
