// Create a shared Image component to handle all cases
import NextImage from 'next/image'
import type { ImageProps as NextImageProps } from 'next/image'

interface Props extends NextImageProps {
  alt: string
}

export function Image(props: Props) {
  return <NextImage {...props} />
}