"use client";

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { TextEffect } from '@/components/motion-primitives/text-effect';
import { MatrixText } from '@/components/motion-primitives/matrix-text';
import { Highlight } from '@/components/Highlight';

const AsciiMap = dynamic(() => import('@/components/AsciiMap'), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const solutionHeadingRef = useRef(null);
  const containerRef = useRef(null);
  const niRef = useRef(null);
  const honRef = useRef(null);
  const bgRef = useRef(null);
  const phase1Ref = useRef(null);
  const phase2Ref = useRef(null);
  const shrineRef = useRef(null);
  const tree1Ref = useRef(null);
  const tree2Ref = useRef(null);
  const buddhaRef = useRef(null);
  const lotusRef = useRef(null);
  const wave1Ref = useRef(null);
  const wave2Ref = useRef(null);
  const loadCircleRef = useRef(null);
  const loadLineRef = useRef(null);
  const loadJpRef = useRef(null);
  const loadSubRef = useRef(null);
  const scrollDownRef = useRef(null);

  useGSAP(() => {
    // ----------------------------------------------------
    // Section 0: Hero Section zooms out on scroll
    // ----------------------------------------------------
    const tl0 = gsap.timeline({
      scrollTrigger: {
        trigger: "#section-hero",
        start: "top top",
        end: "+=150%",
        scrub: 1,
        pin: true,
      }
    });

    // Fade out the scroll prompt as we scroll down
    tl0.to([scrollDownRef.current, loadLineRef.current], { opacity: 0, duration: 0.2 }, 0);

    // Zoom out the circle and the text
    tl0.fromTo(loadCircleRef.current,
      { scale: 20, opacity: 0, filter: 'blur(20px)' },
      { scale: 1, opacity: 1, filter: 'blur(0px)', ease: 'power2.out', duration: 1 },
      0.1
    )
    .fromTo(loadJpRef.current,
      { scale: 20, opacity: 0, filter: 'blur(20px)' },
      { scale: 1, opacity: 1, filter: 'blur(0px)', ease: 'power2.out', duration: 1 },
      0.1
    )
    // Fade in subtitle and description
    .fromTo([loadSubRef.current, ".hero-desc"], 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5 },
      0.6
    );

    // ----------------------------------------------------
    // Section 1: 'Ni' Image falls and background turns Red
    // ----------------------------------------------------
    const tl1 = gsap.timeline({
      scrollTrigger: {
        trigger: "#section-ni",
        start: "top top", // When section hits top of viewport
        end: "+=150%",    // Pin for 1.5x screen height
        scrub: 1,         // Smooth scrubbing
        pin: true,
      }
    });

    // Ni image zooms out from massive scale (center transparent hole covers screen) down to normal size
    tl1.fromTo(niRef.current, 
      { scale: 30, opacity: 0, filter: 'blur(20px) drop-shadow(0px 25px 25px rgba(0,0,0,0.5))', transformOrigin: "center center" }, 
      { scale: 1, opacity: 1, filter: 'blur(0px) drop-shadow(0px 25px 25px rgba(0,0,0,0.5))', ease: 'power2.out', duration: 1 }
    )
    // Fade out phase 1 text exactly as the red walls frame the text (approx 70% through the zoom)
    .to(phase1Ref.current, { opacity: 0, duration: 0.3 }, 0.7)
    // Background instantly turns red (#d80707) when placed
    .to(bgRef.current, { backgroundColor: '#d80707', duration: 0.1 }, 1.0);

    // ----------------------------------------------------
    // Section 2: 'Hon' Image zooms out and background turns White
    // ----------------------------------------------------
    const tl2 = gsap.timeline({
      scrollTrigger: {
        trigger: "#section-hon",
        start: "top top",
        end: "+=150%",
        scrub: 1,
        pin: true,
      }
    });

    // Hon image zooms out from massive scale
    tl2.fromTo(honRef.current, 
      { scale: 30, opacity: 0, filter: 'blur(20px) drop-shadow(0px 25px 25px rgba(0,0,0,0.5))', transformOrigin: "center center" }, 
      { scale: 1, opacity: 1, filter: 'blur(0px) drop-shadow(0px 25px 25px rgba(0,0,0,0.5))', ease: 'power2.out', duration: 1 }
    )
    // Fade out phase 2 text as the white walls frame it
    .to(phase2Ref.current, { opacity: 0, duration: 0.3 }, 0.7)
    // Background turns white again
    .to(bgRef.current, { backgroundColor: '#ffffff', duration: 0.1 }, 1.0);

    // ----------------------------------------------------
    // Section 3: Executive Summary Parallax
    // ----------------------------------------------------
    const tlShrine = gsap.timeline({
      scrollTrigger: {
        trigger: "#section-summary",
        start: "top 80%", 
        end: "bottom top", 
        scrub: 1,
      }
    });

    tlShrine.fromTo(shrineRef.current,
      { x: "100vw", opacity: 0 },
      { x: 0, opacity: 1, duration: 0.3 }
    ).to(shrineRef.current,
      { x: -100, duration: 0.7 }
    );

    // ----------------------------------------------------
    // Section 5: Trees Independent ScrollTriggers
    // ----------------------------------------------------
    gsap.fromTo(tree1Ref.current,
      { x: "-50vw", y: "20vh", opacity: 0, filter: 'blur(10px)' },
      { 
        x: 0, y: 0, opacity: 1, filter: 'blur(0px)', ease: "power2.out",
        scrollTrigger: {
          trigger: tree1Ref.current,
          start: "top 90%", // Trigger when top of tree1 hits 90% of viewport
          end: "top 40%",   // Ends much later, spreading the animation out
          scrub: 1,
        }
      }
    );

    gsap.fromTo(tree2Ref.current,
      { x: "50vw", y: "-20vh", opacity: 0, filter: 'blur(10px)' },
      { 
        x: 0, y: 0, opacity: 1, filter: 'blur(0px)', ease: "power2.out",
        scrollTrigger: {
          trigger: tree2Ref.current,
          start: "top 90%", // Trigger when top of tree2 hits 90% of viewport
          end: "bottom 80%",
          scrub: 1,
        }
      }
    );

    // ----------------------------------------------------
    // Section 6: Buddha and Lotus Independent ScrollTriggers
    // ----------------------------------------------------
    gsap.fromTo(buddhaRef.current,
      { x: "-50vw", y: "20vh", opacity: 0, filter: 'blur(10px)' },
      { 
        x: 0, y: 0, opacity: 1, filter: 'blur(0px)', ease: "power2.out",
        scrollTrigger: {
          trigger: buddhaRef.current,
          start: "top 90%",
          end: "top 40%",
          scrub: 1,
        }
      }
    );

    gsap.fromTo(lotusRef.current,
      { x: "50vw", y: "20vh", opacity: 0, filter: 'blur(10px)' },
      { 
        x: 0, y: 0, opacity: 1, filter: 'blur(0px)', ease: "power2.out",
        scrollTrigger: {
          trigger: lotusRef.current,
          start: "top 90%",
          end: "top 40%",
          scrub: 1,
        }
      }
    );

    // ----------------------------------------------------
    // Section 6: Our Solution Zoom
    // ----------------------------------------------------
    gsap.fromTo(solutionHeadingRef.current,
      { scale: 5, opacity: 0, filter: 'blur(10px)' },
      { 
        scale: 1, opacity: 1, filter: 'blur(0px)', ease: "power3.out",
        scrollTrigger: {
          trigger: solutionHeadingRef.current,
          start: "top 90%", 
          end: "top 30%",
          scrub: 1,
        }
      }
    );

    // ----------------------------------------------------
    // Section 7: Waves Parallax
    // ----------------------------------------------------
    const tlWaves = gsap.timeline({
      scrollTrigger: {
        trigger: "#section-waves",
        start: "top bottom",
        end: "center center",
        scrub: 1,
      }
    });

    // Background wave moves (parallax), foreground stays static
    tlWaves.fromTo(wave2Ref.current,
      { y: 150 },
      { y: 0, ease: "none" },
      0
    );

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative w-full overflow-x-hidden font-sans">
      
      {/* Global Background Layer */}
      <div ref={bgRef} className="fixed inset-0 -z-10 bg-[#fbf9f8]"></div>

      {/* 1. Hero Section (Warm Off-White) */}
      <section id="section-hero" className="h-screen relative flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        
        {/* Center Content Container */}
        <div className="relative flex flex-col items-center justify-center w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] md:w-[600px] md:h-[600px]">
          
          {/* Large Thin Circle */}
          <div ref={loadCircleRef} className="absolute inset-0 rounded-full border border-[#f3e1e1] pointer-events-none" />

          <div className="flex flex-col items-center mt-[-20px]">
            {/* Kanji */}
            <h1 ref={loadJpRef} className="text-[#3d1111] text-[120px] sm:text-[140px] md:text-[180px] leading-none font-light tracking-widest ml-[0.1em] mb-4" style={{ fontFamily: '"Noto Serif JP", "Mincho", serif' }}>
              日本
            </h1>

            {/* Subtitle */}
            <h2 ref={loadSubRef} className="text-[#e27676] text-[8px] sm:text-[10px] md:text-[11px] font-medium tracking-[0.5em] md:tracking-[0.8em] uppercase mb-16 ml-[0.5em]">
              Urbanization - Growth
            </h2>

            {/* Description */}
            <div className="hero-desc">
              <TextEffect delay={0} as="p" per="word" className="text-[#a0a0a0] text-xs sm:text-sm md:text-base font-light leading-relaxed max-w-[280px] sm:max-w-[380px]">
                An advanced predictive model analyzing <span className="font-medium text-[#d80707]">urbanization</span> and<br className="hidden md:block"/> <span className="font-medium text-[#d80707]">demographic shifts</span> across Japan.
              </TextEffect>
            </div>
          </div>
        </div>

        {/* Vertical Scroll Indicator */}
        <div ref={loadLineRef} className="absolute bottom-24 md:bottom-32 w-[1px] h-12 md:h-20 bg-[#ebc8c8]" />
        
        {/* Scroll Down Prompt */}
        <div ref={scrollDownRef} className="absolute bottom-12 md:bottom-16 text-[#a0a0a0] text-[10px] tracking-[0.3em] uppercase font-light animate-bounce">
          Scroll Down
        </div>
      </section>

      {/* 2. Ni Falling Section */}
      <section id="section-ni" className="h-screen w-full relative flex items-center justify-center overflow-hidden">
        {/* Placeholder text that gets revealed or covered */}
        <div ref={phase1Ref} className="absolute z-0 text-center pointer-events-none text-black">
          <h3 className="text-6xl font-bold mb-4 tracking-widest opacity-20">JAPAN</h3>
        </div>
        <img 
          ref={niRef} 
          src="/img/ni.png" 
          alt="Ni" 
          className="absolute z-10 w-full h-full object-fill pointer-events-none drop-shadow-2xl" 
        />
      </section>

      {/* 3. Executive Summary (Red Background Phase) */}
      <section id="section-summary" className="min-h-screen flex flex-col justify-center px-6 md:px-24 py-32 md:py-48 text-white relative z-20 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center gap-12 lg:gap-24">
          
          {/* Text Content */}
          <div className="w-full md:w-1/2">
            <h3 className="text-xs md:text-sm font-medium tracking-[0.5em] text-white/70 uppercase mb-12 text-center md:text-left">
              Executive Summary
            </h3>
            <div className="space-y-12">
              <TextEffect as="p" per="word" className="text-xl md:text-2xl font-light leading-relaxed text-white/95 text-center md:text-left">
                Japan is an island nation defined by a harmonious blend of <Highlight variant="white">deep-rooted traditions</Highlight> and <Highlight variant="white">forward-thinking innovation</Highlight>. At the foundation of Japanese society lies a commitment to <Highlight variant="white">social harmony (和)</Highlight>, politeness, and mutual respect, which are reflected in daily customs like bowing, indirect communication, and meticulously following etiquette. This societal framework is spiritually rooted in both <Highlight variant="white">Shintoism</Highlight>—which instills a reverence for nature and spirits (神)—and <Highlight variant="white">Zen Buddhism</Highlight>, which emphasizes mindfulness, simplicity, and discipline. These philosophies shape everything from ancient arts like the tea ceremony (茶道) and flower arranging (生け花) to traditional culinary practices (和食).
              </TextEffect>
              <TextEffect as="p" per="word" className="text-xl md:text-2xl font-light leading-relaxed text-white/95 text-center md:text-left">
                In contemporary times, Japan has seamlessly integrated its heritage with <Highlight variant="white">modern technological</Highlight> and <Highlight variant="white">creative achievements</Highlight>. Sprawling urban centers like Tokyo showcase futuristic architecture, <Highlight variant="white">bullet train infrastructure</Highlight>, and <Highlight variant="white">cutting-edge robotics</Highlight> alongside centuries-old shrines and tranquil gardens. Furthermore, Japanese pop culture—including anime, manga, gaming, and fashion—has attained massive global reach while maintaining the nation's signature dedication to <Highlight variant="white">craftsmanship (ものづくり)</Highlight> and aesthetic detail.
              </TextEffect>
            </div>
          </div>

          {/* Shrine Image (Parallax) */}
          <div className="w-full md:w-1/2 flex justify-center">
            <img 
              ref={shrineRef} 
              src="/img/shrine.png" 
              alt="Shrine" 
              className="w-full max-w-md lg:max-w-lg object-contain drop-shadow-2xl" 
            />
          </div>
          
        </div>
      </section>

      {/* 4. Hon Falling Section */}
      <section id="section-hon" className="h-screen w-full relative flex items-center justify-center overflow-hidden">
        <div ref={phase2Ref} className="absolute z-0 text-center pointer-events-none text-white">
          <h3 className="text-6xl font-bold mb-4 tracking-widest opacity-20">POPULATION</h3>
        </div>
        <img 
          ref={honRef} 
          src="/img/hon.png" 
          alt="Hon" 
          className="absolute z-10 w-full h-full object-fill pointer-events-none drop-shadow-2xl" 
        />
      </section>

      {/* 5. Demographic ASCII Analysis Phase */}
      <section id="section-collapse" className="relative w-full bg-white z-20 flex flex-col items-center py-24 md:py-40 overflow-hidden">
        
        {/* Decorative Trees */}
        <div ref={tree1Ref} className="absolute left-[-10%] bottom-0 w-80 md:w-[500px] lg:w-[600px] z-0 opacity-80 pointer-events-none">
          <img 
            src="/img/tree2.png"
            alt="Tree Left"
            className="w-full h-full object-contain drop-shadow-2xl -scale-x-100"
          />
        </div>
        <div ref={tree2Ref} className="absolute right-[-10%] top-10 w-80 md:w-[500px] lg:w-[600px] z-0 opacity-80 pointer-events-none">
          <img 
            src="/img/tree2.png"
            alt="Tree Right"
            className="w-full h-full object-contain drop-shadow-2xl"
          />
        </div>

        {/* Content Container */}
        <div className="w-full max-w-3xl px-6 space-y-8 text-left relative z-10 bg-white/80 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none rounded-2xl p-6 md:p-0">

          <TextEffect as="h2" per="word" className="text-3xl md:text-4xl font-light tracking-wide text-[#222222] uppercase mb-12">
            The Trajectory <br/> of <Highlight variant="red">Collapse</Highlight>
          </TextEffect>
          
          <TextEffect as="p" per="word" className="text-base md:text-lg font-light text-gray-500 leading-loose">
            By 2035, more than <Highlight variant="red">60%</Highlight> of Japan's geographic landmass will experience <Highlight variant="red">severe economic contraction</Highlight> as populations migrate aggressively toward <Highlight variant="red">metropolitan gravity wells</Highlight> like Tokyo and Osaka.
          </TextEffect>

          <TextEffect as="p" per="word" className="text-base md:text-lg font-light text-gray-500 leading-loose">
            Rural prefectures face a <Highlight variant="red">systemic collapse</Highlight>. Entire municipalities are grappling with <Highlight variant="red">mass housing abandonment (空き家)</Highlight>, shrinking tax bases, and critical labor shortages in healthcare and infrastructure maintenance.
          </TextEffect>

          <TextEffect as="p" per="word" className="text-base md:text-lg font-light text-gray-500 leading-loose">
            <strong className="font-medium text-gray-800">Ultra-Low Fertility Rates:</strong> Japan's total fertility rate sits around <Highlight variant="red">1.14 children per woman</Highlight>—far below the 2.1 replacement rate needed for demographic stability. Annual births have dropped to historic lows (around 670,000), driven by delayed marriage, financial pressures, and shifting socio-economic priorities among younger generations.
          </TextEffect>

          <TextEffect as="p" per="word" className="text-base md:text-lg font-light text-gray-500 leading-loose">
            <strong className="font-medium text-gray-800">Super-Aged Society:</strong> Over <Highlight variant="red">30% of the population is 65 years or older</Highlight>, with a global-leading median age surpassing 50 years. This creates an <Highlight variant="red">inverted population pyramid</Highlight>, placing immense fiscal pressure on public pensions, healthcare systems, and municipal infrastructure.
          </TextEffect>

          <TextEffect as="p" per="word" className="text-base md:text-lg font-light text-gray-500 leading-loose">
            <strong className="font-medium text-gray-800">Surging Foreign Workforce:</strong> While the native Japanese population fell below 120 million for the first time in over 40 years, the <Highlight variant="red">foreign resident population</Highlight> has expanded to over 4 million. Immigration policy reforms and active foreign labor recruitment serve as a key economic buffer against severe nationwide labor shortages.
          </TextEffect>

          <TextEffect as="p" per="word" className="text-base md:text-lg font-light text-gray-500 leading-loose">
            <strong className="font-medium text-gray-800">Automation & AI Adoption:</strong> To counter labor force shrinkage, Japan is aggressively investing in <Highlight variant="red">industrial automation</Highlight>, caretaking robotics, and digital infrastructure to maintain economic productivity despite a shrinking working-age base.
          </TextEffect>

          <TextEffect as="p" per="word" className="text-base md:text-lg font-light text-gray-500 leading-loose pt-8">
            The nation is approaching an <Highlight variant="red">irreversible demographic singularity</Highlight>.
          </TextEffect>
        </div>

      </section>

      {/* Spacer for empty white space scroll */}
      <div className="w-full h-[75vh] bg-white z-20 relative"></div>

      {/* 6. Our Solution Section */}
      <section id="section-solution" className="min-h-screen w-full bg-white relative z-20 flex flex-col justify-center items-center py-32 px-6 overflow-hidden">
        
        {/* Decorative Elements */}
        <div ref={buddhaRef} className="absolute left-[-10%] bottom-0 w-80 md:w-[400px] lg:w-[500px] z-0 opacity-80 pointer-events-none">
          <img 
            src="/img/buddha.png"
            alt="Buddha"
            className="w-full h-full object-contain drop-shadow-2xl"
          />
        </div>
        <div ref={lotusRef} className="absolute right-[-5%] bottom-10 w-64 md:w-[300px] lg:w-[400px] z-0 opacity-80 pointer-events-none">
          <img 
            src="/img/lotus.png"
            alt="Lotus"
            className="w-full h-full object-contain drop-shadow-2xl"
          />
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col gap-12 text-[#222222] items-center">
          <h1 ref={solutionHeadingRef} className="text-4xl md:text-7xl font-light tracking-wide uppercase mb-8 text-center">
            OUR <Highlight variant="red">SOLUTION</Highlight>
          </h1>

          <div className="max-w-4xl space-y-8 text-left w-full">
            <TextEffect as="p" per="word" className="text-xl md:text-2xl font-light leading-relaxed">
              We built a <Highlight variant="red">regularized spatial ML pipeline</Highlight> evaluated across all 47 prefectures:
            </TextEffect>

            <ul className="space-y-6 list-none">
              <li>
                <TextEffect as="p" per="word" className="text-base md:text-lg font-light leading-loose text-gray-600">
                  <strong className="font-medium text-black">Leakage-Free Feature Engineering:</strong> Purged <Highlight variant="red">future target component variables</Highlight>, standardized all predictors, and applied a <Highlight variant="red">log-transformation</Highlight> to baseline population (log_pop_2020) to stabilize scale variance across prefectures.
                </TextEffect>
              </li>
              <li>
                <TextEffect as="p" per="word" className="text-base md:text-lg font-light leading-loose text-gray-600">
                  <strong className="font-medium text-black">Ridge Regression Baseline:</strong> Replaced tree models with <Highlight variant="red">L2 Regularized Ridge Regression</Highlight> to evenly distribute predictive weights across features. Validated with <Highlight variant="red">Leave-One-Out Cross-Validation (LOOCV)</Highlight>, achieving an out-of-sample <Highlight variant="red">R² of 0.9120</Highlight> and an <Highlight variant="red">RMSE of 0.4890</Highlight>.
                </TextEffect>
              </li>
              <li>
                <TextEffect as="p" per="word" className="text-base md:text-lg font-light leading-loose text-gray-600">
                  <strong className="font-medium text-black">Spatial Diagnostics (PySAL/ESDA):</strong> Calculated <Highlight variant="red">Anselin Local Moran’s I</Highlight> on model residuals using spatial contiguity matrices to detect regional performance clusters and <Highlight variant="red">spatial autocorrelation hotspots</Highlight>.
                </TextEffect>
              </li>
              <li>
                <TextEffect as="p" per="word" className="text-base md:text-lg font-light leading-loose text-gray-600">
                  <strong className="font-medium text-black">Linear SHAP Feature Attribution:</strong> Isolated the directional impact of key drivers: <Highlight variant="red">Aging Rate (-0.938)</Highlight> accelerates population decline, <Highlight variant="red">Net Migration (+0.674)</Highlight> serves as the primary protective buffer, <Highlight variant="red">Log Population (+0.129)</Highlight> provides a scale cushion, and <Highlight variant="red">Historical GDP (-0.138)</Highlight> captures structural economic transitions.
                </TextEffect>
              </li>
            </ul>
          </div>
        </div>

      </section>

      {/* 7. Wave Transition & Run The Model (Black Theme) */}
      <section id="section-waves" className="w-full relative z-30 flex flex-col bg-white overflow-hidden pt-12 md:pt-32">
        
        {/* Waves Container */}
        <div className="relative w-full flex items-end justify-center overflow-hidden bg-white">
          {/* Wave 2 (Background - drives the height of the container) */}
          <img 
            ref={wave2Ref}
            src="/img/wavepng2.png" 
            alt="Wave Background" 
            className="relative w-full h-auto object-cover"
          />
          {/* Wave 1 (Foreground) */}
          <img 
            ref={wave1Ref}
            src="/img/wavepng1.png" 
            alt="Wave Foreground" 
            className="absolute bottom-0 left-0 w-full h-auto object-cover z-10"
          />
        </div>

        {/* Black Theme Section */}
        <div className="w-full bg-black min-h-screen flex flex-col items-center justify-center relative z-20 px-6 mt-[-1px]">
          <div className="text-center space-y-12">
            <h1 className="text-5xl md:text-8xl font-light tracking-widest text-white uppercase">
              Run The <span className="text-[#e27676]">Model</span>
            </h1>
            <p className="text-gray-400 font-light tracking-widest text-sm md:text-base uppercase max-w-2xl mx-auto">
              Initialize the spatial machine learning pipeline to interact with the simulated projections of Japan's future.
            </p>
            <div className="pt-8">
              <Link href="/model">
                <button className="px-12 py-4 border border-[#e27676] text-[#e27676] text-sm tracking-[0.2em] uppercase hover:bg-[#e27676] hover:text-black transition-all duration-300 rounded-full font-light">
                  Initialize Simulation
                </button>
              </Link>
            </div>
          </div>
        </div>

      </section>

    </div>
  );
}
