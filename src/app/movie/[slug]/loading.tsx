
export default function MovieLoading() {
  return (
    <div className="flex flex-col gap-10 pb-20 max-w-6xl mx-auto animate-pulse px-4">
      <div className="h-10 w-32 bg-white/5 rounded-lg" />
      
      <div className="grid grid-cols-1 lg:grid-cols-[350px,1fr] gap-8 items-start">
        <div className="aspect-[2/3] bg-white/5 rounded-2xl" />
        
        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <div className="h-6 w-24 bg-white/5 rounded" />
            <div className="h-16 w-3/4 bg-white/5 rounded" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-white/5 rounded-xl" />
            ))}
          </div>
          
          <div className="h-40 bg-white/5 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
