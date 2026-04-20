import React, { useEffect, useRef } from 'react';

const ParticleNetwork = () => {
	const canvasRef = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');
		let animationFrameId;
		let particles = [];

		const initParticles = () => {
			particles = [];
			// Responsive amount of particles based on screen size
			const numParticles = Math.floor(
				(canvas.width * canvas.height) / 12000
			);
			for (let i = 0; i < numParticles; i++) {
				particles.push({
					x: Math.random() * canvas.width,
					y: Math.random() * canvas.height,
					vx: (Math.random() - 0.5) * 0.6, // Velocity X
					vy: (Math.random() - 0.5) * 0.6, // Velocity Y
					radius: Math.random() * 1.5 + 0.5
				});
			}
		};

		const resizeCanvas = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			initParticles();
		};

		const draw = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			for (let i = 0; i < particles.length; i++) {
				let p = particles[i];
				p.x += p.vx;
				p.y += p.vy;

				// Bounce off walls
				if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
				if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

				// Draw Particle
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
				ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
				ctx.fill();

				// Connect Particles
				for (let j = i + 1; j < particles.length; j++) {
					let p2 = particles[j];
					let dx = p.x - p2.x;
					let dy = p.y - p2.y;
					let dist = Math.sqrt(dx * dx + dy * dy);

					if (dist < 130) {
						ctx.beginPath();
						ctx.moveTo(p.x, p.y);
						ctx.lineTo(p2.x, p2.y);
						ctx.strokeStyle = `rgba(167, 139, 250, ${1 - dist / 130})`;
						ctx.lineWidth = 0.8;
						ctx.stroke();
					}
				}
			}
			animationFrameId = requestAnimationFrame(draw);
		};

		window.addEventListener('resize', resizeCanvas);
		resizeCanvas();
		draw();

		return () => {
			window.removeEventListener('resize', resizeCanvas);
			cancelAnimationFrame(animationFrameId);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				zIndex: 0,
				pointerEvents: 'none'
			}}
		/>
	);
};

export default ParticleNetwork;
