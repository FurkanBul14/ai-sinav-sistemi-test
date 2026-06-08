import React from 'react'
import { render } from '@testing-library/react'

import CameraFeed from './CameraFeed'

describe('CameraFeed Component', () => {

  test('video elementi render edilmeli', () => {
    const videoRef = React.createRef()

    render(
      <CameraFeed
        videoRef={videoRef}
        isProctoringStarted={false}
      />
    )

    expect(document.querySelector('video')).toBeInTheDocument()
  })

  test('proctoring başlamadıysa video gizli olmalı', () => {
    const videoRef = React.createRef()

    render(
      <CameraFeed
        videoRef={videoRef}
        isProctoringStarted={false}
      />
    )

    const video = document.querySelector('video')

    expect(video).toHaveStyle({
      display: 'none',
    })
  })

  test('proctoring başladıysa video görünür olmalı', () => {
    const videoRef = React.createRef()

    render(
      <CameraFeed
        videoRef={videoRef}
        isProctoringStarted={true}
      />
    )

    const video = document.querySelector('video')

    expect(video).toHaveStyle({
      display: 'block',
    })
  })

  test('videoRef doğru şekilde video elementine bağlanmalı', () => {
    const videoRef = React.createRef()

    render(
      <CameraFeed
        videoRef={videoRef}
        isProctoringStarted={true}
      />
    )

    expect(videoRef.current).toBeInstanceOf(HTMLVideoElement)
  })

  test('video gerekli medya özelliklerine sahip olmalı', () => {
    const videoRef = React.createRef()

    render(
      <CameraFeed
        videoRef={videoRef}
        isProctoringStarted={true}
      />
    )

    const video = document.querySelector('video')

    expect(video).toHaveAttribute('autoplay')
    expect(video).toHaveAttribute('playsinline')
    expect(video.muted).toBe(true)
  })

  test('video ayna efekti stiline sahip olmalı', () => {
    const videoRef = React.createRef()

    render(
      <CameraFeed
        videoRef={videoRef}
        isProctoringStarted={true}
      />
    )

    const video = document.querySelector('video')

    expect(video).toHaveStyle({
      transform: 'scaleX(-1)',
      position: 'fixed',
    })
  })

})