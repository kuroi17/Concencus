/**
 * ConcensusLogo — renders the official Concensus SVG logo mark.
 *
 * Props:
 *   size   — pixel size (applied as width & height). Default 32.
 *   className — extra Tailwind/CSS classes.
 */
function ConcensusLogo({ size = 32, className = "" }) {
  return (
    <img
      src="/favicon.svg?v=2"
      alt="Concensus logo"
      width={size}
      height={size}
      className={className}
      draggable={false}
    />
  );
}

export default ConcensusLogo;

