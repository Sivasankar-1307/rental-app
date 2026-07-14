export default function Hero() {
  return (
    <section >
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/50 dark:bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-200/50 dark:bg-pink-900/20 rounded-full blur-[120px] animate-float" />
      </div>

      <div >
        <center>
        <h1 style={{margin:"20px", marginTop:"100px",color:"white"}} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 leading-tight animate-fade-in-down">
          Elevate Your <span className="text-gradient">Celebrations.</span>
        </h1>
        <p className="text-lg md:text-2xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto font-medium animate-fade-in-up" style={{ animationDelay: "0.2s",margin:"10px", padding:"10px" }}>
          The premium way to rent equipment for your unforgettable events. 
          Quality guaranteed, delivered with care.
        </p>
        </center>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center animate-scale-in" style={{ animationDelay: "0.4s",margin:"10px", padding:"10px" }}>
          <div className="relative flex-1 max-w-md group">
            <div className="absolute inset-0 bg-primary opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500" />
            <input
            style={{padding:"10px"}}
              type="text"
              placeholder="What are you hosting?"
              className="w-full relative px-8 py-5 glass-morphism rounded-2xl text-gray-800 dark:text-white placeholder-gray-400 outline-none focus:ring-4 focus:ring-primary/20 transition-all font-bold text-lg"
            />
          </div>
          <button className="px-10 py-5 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-black text-lg shadow-xl shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all duration-300">
            DISCOVER
          </button>
        </div>

        {/* Floating Stats or Trust Badges */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale animate-fade-in" style={{ animationDelay: "0.6s",margin:"10px", padding:"10px" }}>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold">500+</span>
            <span className="text-xs font-bold uppercase tracking-widest leading-none text-left">Items<br/>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold">24/7</span>
            <span className="text-xs font-bold uppercase tracking-widest leading-none text-left">Support<br/>Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold">Free</span>
            <span className="text-xs font-bold uppercase tracking-widest leading-none text-left">Setup &<br/>Delivery</span>
          </div>
        </div>
      </div>
    </section>
  );
}
