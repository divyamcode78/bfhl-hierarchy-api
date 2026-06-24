function Spinner() {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-400"
        role="status"
        aria-label="Loading"
      />
      <span className="text-sm text-slate-400">Processing hierarchy...</span>
    </div>
  );
}

export default Spinner;
