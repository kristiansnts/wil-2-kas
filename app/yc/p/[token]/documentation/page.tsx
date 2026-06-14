import { redirect } from 'next/navigation'

type Props = { params: Promise<{ token: string }> }

export default async function DocumentationRedirectPage({ params }: Props) {
  const { token } = await params
  redirect(`/yc/p/${token}/dokumentasi`)
}
