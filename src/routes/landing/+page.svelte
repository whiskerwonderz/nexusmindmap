<script lang="ts">
  import { goto } from '$app/navigation';

  let mouseX = $state(0.5);
  let mouseY = $state(0.5);

  // Generate stars with natural celestial drift
  const stars = Array.from({ length: 200 }, (_, i) => ({
    id: i,
    startX: Math.random() * 140,
    y: Math.random() * 100,
    size: 0.8 + Math.random() * 2.5,
    baseOpacity: 0.4 + Math.random() * 0.6,
    speed: 200 + Math.random() * 300,
    delay: Math.random() * -200,
    twinkleDuration: 3 + Math.random() * 6,
    twinkleDelay: Math.random() * 6,
    driftAngle: -5 + Math.random() * 10,
    depth: Math.random(), // For parallax
  }));

  // Shooting stars - rare, spread across sky
  const shootingStars = [
    { id: 0, startX: 15, startY: 10, delay: 12, duration: 0.7 },
    { id: 1, startX: 75, startY: 25, delay: 45, duration: 0.9 },
    { id: 2, startX: 40, startY: 5, delay: 78, duration: 0.6 },
  ];

  // Subtle constellation connections - smaller, fewer points
  const constellations = [
    { points: '12,18 18,22 26,19', delay: 0 },
    { points: '72,65 78,70 85,67', delay: 15 },
    { points: '45,35 52,32 58,36', delay: 30 },
  ];

  function enterApp() {
    goto('/');
  }

  function handleMouseMove(e: MouseEvent) {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
  }
</script>

<svelte:head>
  <title>NexusMindMap</title>
  <meta name="description" content="Your scattered thoughts, skills, and journeys - revealed as constellations." />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap" rel="stylesheet">
</svelte:head>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="landing" onmousemove={handleMouseMove}>
  <!-- CSS Starfield with parallax -->
  <div class="starfield" style="transform: translate({(mouseX - 0.5) * 20}px, {(mouseY - 0.5) * 20}px)">
    {#each stars as star}
      <div
        class="star"
        style="
          left: {star.startX}%;
          top: {star.y}%;
          width: {star.size}px;
          height: {star.size}px;
          --star-opacity: {star.baseOpacity};
          --flow-duration: {star.speed}s;
          --flow-delay: {star.delay}s;
          --twinkle-duration: {star.twinkleDuration}s;
          --twinkle-delay: {star.twinkleDelay}s;
          --drift-angle: {star.driftAngle}deg;
        "
      ></div>
    {/each}

    <!-- Shooting stars -->
    {#each shootingStars as meteor}
      <div
        class="shooting-star"
        style="
          left: {meteor.startX}%;
          top: {meteor.startY}%;
          --shoot-delay: {meteor.delay}s;
          --shoot-duration: {meteor.duration}s;
        "
      ></div>
    {/each}
  </div>

  <!-- Constellation lines that form and fade -->
  <svg class="constellations" viewBox="0 0 100 100" preserveAspectRatio="none">
    {#each constellations as constellation}
      <polyline
        class="constellation-line"
        points={constellation.points}
        style="--constellation-delay: {constellation.delay}s"
      />
    {/each}
  </svg>

  <!-- Nebula ambient glow -->
  <div class="nebula"></div>

  <!-- Content - NO text animations, all visible immediately -->
  <div class="content">
    <!-- Logo with ambient animation -->
    <div class="logo">
      <div class="logo-frame">
        <img src="/logo.png" alt="NexusMindMap" />
        <div class="logo-glow"></div>
      </div>
    </div>

    <!-- Hero text - visible immediately -->
    <div class="hero">
      <h1>The dots connect looking backward.</h1>
      <h1>Your constellation is already taking shape.</h1>
    </div>

    <!-- CTA -->
    <button class="cta" onclick={enterApp}>
      <span class="cta-text">Map yours</span>
      <svg class="cta-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>

    <!-- Brand signature -->
    <div class="brand">
      <p class="brand-name">Nexus Mind Map</p>
      <p class="brand-tagline">For builders who travel. Explorers who build.</p>
    </div>
  </div>
</div>

<style>
  .landing {
    position: fixed;
    inset: 0;
    background: #0a0a0f;
    overflow: hidden;
  }

  /* Starfield with parallax */
  .starfield {
    position: absolute;
    inset: -20px;
    width: calc(100% + 40px);
    height: calc(100% + 40px);
    transition: transform 0.3s ease-out;
  }

  .star {
    position: absolute;
    background: radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(220, 235, 255, 0.6) 40%, transparent 100%);
    border-radius: 50%;
    opacity: var(--star-opacity);
    animation:
      starDrift var(--flow-duration) linear infinite,
      shimmer var(--twinkle-duration) ease-in-out infinite;
    animation-delay: var(--flow-delay), var(--twinkle-delay);
  }

  @keyframes starDrift {
    0% { transform: rotate(var(--drift-angle)) translateX(0); }
    100% { transform: rotate(var(--drift-angle)) translateX(-150vw); }
  }

  @keyframes shimmer {
    0%, 100% { opacity: var(--star-opacity); }
    40% { opacity: var(--star-opacity); }
    50% { opacity: calc(var(--star-opacity) * 1.8); }
    60% { opacity: var(--star-opacity); }
  }

  /* Shooting stars - rare */
  .shooting-star {
    position: absolute;
    width: 80px;
    height: 1px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.7), transparent);
    opacity: 0;
    animation: shoot 90s linear infinite;
    animation-delay: var(--shoot-delay);
    transform: rotate(35deg);
  }

  @keyframes shoot {
    0%, 98% { opacity: 0; transform: rotate(35deg) translateX(0); }
    98.5% { opacity: 1; }
    99.5% { opacity: 0; transform: rotate(35deg) translateX(-250px); }
    100% { opacity: 0; }
  }

  /* Constellation lines - very subtle */
  .constellations {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .constellation-line {
    fill: none;
    stroke: rgba(150, 200, 255, 0.08);
    stroke-width: 0.08;
    stroke-linecap: round;
    opacity: 0;
    animation: constellationFade 60s ease-in-out infinite;
    animation-delay: var(--constellation-delay);
  }

  @keyframes constellationFade {
    0%, 100% { opacity: 0; }
    25%, 40% { opacity: 1; }
    65% { opacity: 0; }
  }

  /* Nebula glow */
  .nebula {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 50% at 20% 40%, rgba(34, 211, 238, 0.03), transparent),
      radial-gradient(ellipse 60% 40% at 80% 60%, rgba(232, 121, 249, 0.02), transparent);
    pointer-events: none;
  }

  /* Content - NO text animations */
  .content {
    position: relative;
    z-index: 10;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    gap: 0;
  }

  /* Logo with ambient animation */
  .logo {
    margin-bottom: 48px;
  }

  .logo-frame {
    position: relative;
    width: 72px;
    height: 72px;
  }

  .logo-frame img {
    width: 100%;
    height: 100%;
    border-radius: 16px;
    position: relative;
    z-index: 1;
  }

  .logo-glow {
    position: absolute;
    inset: -10px;
    background: radial-gradient(circle, rgba(100, 150, 255, 0.2), transparent 70%);
    border-radius: 24px;
    animation: logoPulse 4s ease-in-out infinite;
  }

  @keyframes logoPulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.08); }
  }

  /* Hero text - visible immediately */
  .hero {
    text-align: center;
    margin-bottom: 32px;
  }

  h1 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(26px, 4.5vw, 40px);
    font-weight: 300;
    line-height: 1.5;
    letter-spacing: 0.01em;
    color: #f5f5f5;
    margin: 0;
  }

  /* CTA button */
  .cta {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 32px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 100px;
    color: #f5f5f5;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .cta:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 30px rgba(100, 150, 255, 0.15);
  }

  .cta-arrow {
    width: 18px;
    height: 18px;
    opacity: 0.7;
    transition: all 0.3s ease;
  }

  .cta:hover .cta-arrow {
    opacity: 1;
    transform: translateX(4px);
  }

  /* Brand signature */
  .brand {
    margin-top: 40px;
    text-align: center;
  }

  .brand-name {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 18px;
    font-weight: 400;
    letter-spacing: 0.2em;
    color: rgba(245, 245, 245, 0.9);
    text-transform: uppercase;
    margin: 0 0 12px 0;
  }

  .brand-tagline {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 20px;
    font-weight: 300;
    font-style: italic;
    letter-spacing: 0.02em;
    color: rgba(245, 245, 245, 0.7);
    margin: 0;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .hero {
      padding: 0 20px;
    }

    h1 {
      font-size: clamp(20px, 5vw, 28px);
      line-height: 1.5;
    }

    .logo {
      margin-bottom: 32px;
    }

    .logo-frame {
      width: 56px;
      height: 56px;
    }

    .brand-name {
      font-size: 14px;
    }

    .brand-tagline {
      font-size: 16px;
    }
  }
</style>
