import Hero from '@/components/Hero'
import Problem from '@/components/Problem'
import HowItWorks from '@/components/HowItWorks'
import Features from '@/components/Features'
import Trust from '@/components/Trust'
import Footer from '@/components/Footer'
import React from 'react'
import Navbar from '@/components/Navbar'

const home = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <Trust />
      <Footer />
    </>
  )
}

export default home