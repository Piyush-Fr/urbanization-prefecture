import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-4 font-sans selection:bg-black selection:text-white relative overflow-hidden">
      
      {/* Return Home Button - Top Right */}
      <Link 
        href="/"
        className="absolute top-6 right-6 px-4 py-2 border-2 border-black font-bold hover:bg-black hover:text-white transition-colors duration-200 uppercase tracking-widest text-xs md:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      >
        &larr; Go Back To Dashboard
      </Link>

      {/* Manga Easter Egg Container */}
      <div className="max-w-2xl w-full flex flex-col items-center space-y-8">
        
        {/* Yotsuba Image */}
        <div className="relative w-full max-w-md aspect-square">
          <img
            src="/error404.png"
            alt="404 - Not Found"
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Disclaimer */}
        <p className="text-xs text-gray-500 font-mono text-center max-w-sm mt-2">
          Yotsuba is just 5 years old so if she used any bad word kindly forgive her :)
        </p>

        {/* Text Container (To be filled by user) */}
        <div className="text-center space-y-4">
          <h1 className="text-xl md:text-3xl lg:text-4xl font-black tracking-tighter w-full whitespace-nowrap">
            Uh Oh!.....You&apos;ve encountered with Yotsuba
          </h1>
          <p className="text-lg md:text-xl font-medium border-2 border-black p-4 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Error 404
          </p>
        </div>

      </div>
    </div>
  );
}
