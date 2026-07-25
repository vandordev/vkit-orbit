import { useReducedMotion } from "framer-motion";
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

type LandFeature = Feature<Polygon | MultiPolygon>;
type LandCollection = FeatureCollection<Polygon | MultiPolygon>;
type Point = [number, number];

interface RotatingEarthProps {
	width?: number;
	height?: number;
	className?: string;
}

interface DotData {
	lng: number;
	lat: number;
}

const LAND_DATA_URL = "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json";

function pointInPolygon([x, y]: Point, polygon: readonly Point[]) {
	let inside = false;

	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const current = polygon[i];
		const previous = polygon[j];
		if (!current || !previous) continue;
		const [xi, yi] = current;
		const [xj, yj] = previous;
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
			inside = !inside;
		}
	}

	return inside;
}

function pointInFeature(point: Point, feature: LandFeature) {
	const geometry = feature.geometry;
	if (geometry.type === "Polygon") {
		const rings = geometry.coordinates as Point[][];
		const outer = rings[0];
		return Boolean(outer && pointInPolygon(point, outer) && !rings.slice(1).some((ring) => pointInPolygon(point, ring)));
	}

	return geometry.coordinates.some((polygon) => {
		const rings = polygon as Point[][];
		const outer = rings[0];
		return Boolean(outer && pointInPolygon(point, outer) && !rings.slice(1).some((ring) => pointInPolygon(point, ring)));
	});
}

function generateDots(feature: LandFeature, spacing = 16): DotData[] {
	const bounds = d3.geoBounds(feature);
	const minimum = bounds[0];
	const maximum = bounds[1];
	if (!minimum || !maximum) return [];
	const [minLng, minLat] = minimum;
	const [maxLng, maxLat] = maximum;
	const stepSize = spacing * 0.08;
	const dots: DotData[] = [];

	for (let lng = minLng; lng <= maxLng; lng += stepSize) {
		for (let lat = minLat; lat <= maxLat; lat += stepSize) {
			const point: Point = [lng, lat];
			if (pointInFeature(point, feature)) dots.push({ lng, lat });
		}
	}

	return dots;
}

export function RotatingEarth({ width = 800, height = 600, className = "" }: RotatingEarthProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const reducedMotion = useReducedMotion();
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const context = canvas.getContext("2d");
		if (!context) return;

		const containerWidth = Math.min(width, window.innerWidth - 40);
		const containerHeight = Math.min(height, window.innerHeight - 100);
		const radius = Math.min(containerWidth, containerHeight) / 2.5;
		const dpr = window.devicePixelRatio || 1;
		canvas.width = containerWidth * dpr;
		canvas.height = containerHeight * dpr;
		canvas.style.width = `${containerWidth}px`;
		canvas.style.height = `${containerHeight}px`;
		context.setTransform(dpr, 0, 0, dpr, 0, 0);

		const projection = d3.geoOrthographic().scale(radius).translate([containerWidth / 2, containerHeight / 2]).clipAngle(90);
		const path = d3.geoPath().projection(projection).context(context);
		const rotation: [number, number] = [0, 0];
		const allDots: DotData[] = [];
		const controller = new AbortController();
		let landFeatures: LandCollection | undefined;
		let autoRotate = reducedMotion !== true;

		const render = () => {
			context.clearRect(0, 0, containerWidth, containerHeight);
			const currentScale = projection.scale();
			const scaleFactor = currentScale / radius;

			context.beginPath();
			context.arc(containerWidth / 2, containerHeight / 2, currentScale, 0, 2 * Math.PI);
			context.fillStyle = "#080b13";
			context.fill();
			context.strokeStyle = "#67e8f9";
			context.lineWidth = 2 * scaleFactor;
			context.stroke();

			if (!landFeatures) return;
			const graticule = d3.geoGraticule();
			context.beginPath();
			path(graticule());
			context.strokeStyle = "#64748b";
			context.lineWidth = scaleFactor;
			context.globalAlpha = 0.35;
			context.stroke();
			context.globalAlpha = 1;

			context.beginPath();
			landFeatures.features.forEach((feature) => path(feature));
			context.strokeStyle = "#cbd5e1";
			context.lineWidth = scaleFactor;
			context.stroke();

			allDots.forEach((dot) => {
				const projected = projection([dot.lng, dot.lat]);
				if (!projected) return;
				context.beginPath();
				context.arc(projected[0], projected[1], 1.2 * scaleFactor, 0, 2 * Math.PI);
				context.fillStyle = "#94a3b8";
				context.fill();
			});
		};

		const rotate = () => {
			if (!autoRotate) return;
			rotation[0] += 0.5;
			projection.rotate(rotation);
			render();
		};
		const rotationTimer = d3.timer(rotate);

		const handleMouseDown = (event: MouseEvent) => {
			autoRotate = false;
			const startX = event.clientX;
			const startY = event.clientY;
			const startRotation: [number, number] = [...rotation];

			const handleMouseMove = (moveEvent: MouseEvent) => {
				rotation[0] = startRotation[0] + (moveEvent.clientX - startX) * 0.5;
				rotation[1] = Math.max(-90, Math.min(90, startRotation[1] - (moveEvent.clientY - startY) * 0.5));
				projection.rotate(rotation);
				render();
			};
			const handleMouseUp = () => {
				document.removeEventListener("mousemove", handleMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
				autoRotate = reducedMotion !== true;
			};

			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		};

		const handleWheel = (event: WheelEvent) => {
			event.preventDefault();
			const nextScale = projection.scale() * (event.deltaY > 0 ? 0.9 : 1.1);
			projection.scale(Math.max(radius * 0.5, Math.min(radius * 3, nextScale)));
			render();
		};

		const loadWorldData = async () => {
			try {
				setIsLoading(true);
				const response = await fetch(LAND_DATA_URL, { signal: controller.signal });
				if (!response.ok) throw new Error("Failed to load land data");
				landFeatures = (await response.json()) as LandCollection;
				landFeatures.features.forEach((feature) => allDots.push(...generateDots(feature)));
				render();
				setIsLoading(false);
			} catch (loadError) {
				if (loadError instanceof DOMException && loadError.name === "AbortError") return;
				setError("Failed to load land map data");
				setIsLoading(false);
			}
		};

		canvas.addEventListener("mousedown", handleMouseDown);
		canvas.addEventListener("wheel", handleWheel, { passive: false });
		loadWorldData();

		return () => {
			controller.abort();
			rotationTimer.stop();
			canvas.removeEventListener("mousedown", handleMouseDown);
			canvas.removeEventListener("wheel", handleWheel);
		};
	}, [height, reducedMotion, width]);

	if (error) {
		return <div className={`flex min-h-80 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 p-8 ${className}`}><div className="text-center"><p className="mb-2 font-semibold text-red-300">Error loading Earth visualization</p><p className="text-sm text-slate-400">{error}</p></div></div>;
	}

	return <div className={`relative ${className}`}><canvas ref={canvasRef} aria-label="Interactive rotating Earth map" className="h-auto w-full rounded-2xl bg-[#080b13]" style={{ maxWidth: "100%", height: "auto" }} />{isLoading && <div className="absolute inset-0 grid place-items-center rounded-2xl bg-[#080b13]/80 text-sm text-slate-400" role="status">Loading Earth map...</div>}<div className="absolute bottom-4 left-4 rounded-md bg-slate-950/90 px-2 py-1 text-xs text-slate-400">Drag to rotate · Scroll to zoom</div></div>;
}
