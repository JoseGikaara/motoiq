/** Shown while public site API is loading (may be retrying on cold start). */
export default function ConnectingToServer({ message = "Connecting to server, please wait..." }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-navy text-gray-400 gap-4">
      <div
        className="w-10 h-10 border-2 border-gray-500 border-t-gray-300 rounded-full animate-spin"
        aria-hidden
      />
      <p className="text-sm">{message}</p>
    </div>
  );
}
