import { Metadata, ResolvingMetadata } from 'next'
import { getPinById, getAllPins } from '@/lib/services/pins'
import { PinDetailClient } from './PinDetailClient'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params
  const pin = await getPinById(id)

  if (!pin) {
    return {
      title: 'Pin Not Found | Mudmy',
    }
  }

  const previousImages = (await parent).openGraph?.images || []

  return {
    title: `${pin.title} | Mudmy Marketplace`,
    description: pin.description,
    openGraph: {
      title: pin.title,
      description: pin.description,
      url: `https://mudmy.com/pin/${id}`,
      siteName: 'Mudmy Marketplace',
      images: [
        {
          url: pin.images[0] || '/og-image.png',
          width: 1200,
          height: 630,
          alt: pin.title,
        },
        ...previousImages,
      ],
      locale: 'th_TH',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pin.title,
      description: pin.description,
      images: [pin.images[0] || '/og-image.png'],
    },
    // App Links / Deep Linking
    other: {
      'al:android:url': `pukmud://pin/${id}`,
      'al:android:package': 'com.phichaya.pukmud',
      'al:android:app_name': 'Pukmud',
      'apple-itunes-app': 'app-id=myAppName, app-argument=pukmud://pin/' + id,
    },
  }
}

export default async function Page({ params }: Props) {
  const { id } = await params
  const pin = await getPinById(id)

  if (!pin) {
    notFound()
  }

  const allPins = await getAllPins(pin.category)
  const relatedPins = allPins.filter((p) => p.id !== pin.id).slice(0, 3)

  // Sanitize data for Client Component serialization.
  const sanitizedPin = JSON.parse(JSON.stringify(pin))
  const sanitizedRelatedPins = JSON.parse(JSON.stringify(relatedPins))

  return <PinDetailClient pin={sanitizedPin} relatedPins={sanitizedRelatedPins} />
}
