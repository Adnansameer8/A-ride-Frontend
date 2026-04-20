import React from 'react'
import Navbar from './Candidate/Navbar/Navbar'
import Hero from './Candidate/Hero/Home'
import About from './Candidate/About/About'
import Explore from './Candidate/Explore/Explore'
import Services from './Candidate/Services/Services'
import Footer from './Footer'

const MainPage = () => {
  return (
    <div >
        
        <Hero/>
        {/* <About/> */}
         <Services/>
        <Explore/>
       <Footer/>
      
    </div>
  )
}

export default MainPage
