export function getInitials(name: string | undefined): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function avatarGradient(username: string | undefined): string {
  const gradients = [
    'linear-gradient(135deg,#7b68ee,#4fd1c5)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#22c55e,#0ea5e9)',
    'linear-gradient(135deg,#ec4899,#8b5cf6)',
    'linear-gradient(135deg,#06b6d4,#3b82f6)',
    'linear-gradient(135deg,#f97316,#facc15)',
  ];
  const key = username || 'unknown';
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}
