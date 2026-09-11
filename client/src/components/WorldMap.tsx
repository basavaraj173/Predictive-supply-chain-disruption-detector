"use client";

import { useRef, useEffect, useState, useCallback } from "react";

// ---------- Types ----------
interface PortData {
  name: string;
  lat: number;
  lng: number;
  type: string;
}

interface ShipData {
  lat: number;
  lng: number;
  type: string;
  risk: string;
}

interface FlightData {
  id?: string;
  lat: number;
  lng: number;
  altitude?: number;
  type: string;
}

interface TrafficData {
  ports: PortData[];
  ships: ShipData[];
  flights: FlightData[];
}

// ---------- Mercator helpers ----------
function mercatorX(lng: number, width: number): number {
  return ((lng + 180) / 360) * width;
}

function mercatorY(lat: number, height: number): number {
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  return height / 2 - (mercN * height) / (2 * Math.PI);
}

// ---------- Risk‑based color ----------
function riskColor(name: string): string {
  // Deterministic hash to assign a heat level per country
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  const risk = Math.abs(h) % 100;
  if (risk > 75) return "rgba(255, 0, 92, 0.55)";   // High – crimson
  if (risk > 50) return "rgba(255, 140, 0, 0.45)";    // Medium – orange
  if (risk > 25) return "rgba(0, 242, 255, 0.30)";    // Low – cyan
  return "rgba(0, 255, 148, 0.25)";                    // Minimal – green
}

// ---------- Component ----------
export default function WorldMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [traffic, setTraffic] = useState<TrafficData>({
    ports: [],
    ships: [],
    flights: [],
  });
  const [geoData, setGeoData] = useState<any>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const animFrameRef = useRef<number>(0);

  // Fetch traffic data
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiBase}/api/v1/geo/traffic`)
      .then((r) => r.json())
      .then((d) => setTraffic(d))
      .catch((e) => console.error("Geo traffic fetch error:", e));
  }, []);

  // Fetch GeoJSON countries
  useEffect(() => {
    // Using public CDN for Natural Earth 110m GeoJSON
    fetch(
      "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
    )
      .then((r) => r.json())
      .then((topo) => {
        // Convert TopoJSON -> GeoJSON features
        const features = topoToGeo(topo, "countries");
        setGeoData(features);
      })
      .catch((err) => {
        console.error("GeoJSON fetch error:", err);
        // Fallback: try alternate CDN
        fetch(
          "https://unpkg.com/world-atlas@2/countries-110m.json"
        )
          .then((r) => r.json())
          .then((topo) => {
            const features = topoToGeo(topo, "countries");
            setGeoData(features);
          })
          .catch((e) => console.error("Fallback GeoJSON also failed:", e));
      });
  }, []);

  // ---------- TopoJSON → GeoJSON converter ----------
  function topoToGeo(topology: any, objectName: string) {
    const obj = topology.objects[objectName];
    if (!obj) return [];

    const arcsData: number[][][] = topology.arcs;
    const transform = topology.transform;

    // Decode quantized arcs
    function decodeArc(arcIdx: number): number[][] {
      const isReverse = arcIdx < 0;
      const idx = isReverse ? ~arcIdx : arcIdx;
      const arc = arcsData[idx];
      const coords: number[][] = [];
      let x = 0,
        y = 0;
      for (const pt of arc) {
        x += pt[0];
        y += pt[1];
        if (transform) {
          coords.push([
            x * transform.scale[0] + transform.translate[0],
            y * transform.scale[1] + transform.translate[1],
          ]);
        } else {
          coords.push([x, y]);
        }
      }
      if (isReverse) coords.reverse();
      return coords;
    }

    function decodeRing(indices: number[]): number[][] {
      let ring: number[][] = [];
      for (const idx of indices) {
        const decoded = decodeArc(idx);
        // Skip duplicate first point when concatenating
        if (ring.length > 0) {
          ring = ring.concat(decoded.slice(1));
        } else {
          ring = decoded;
        }
      }
      return ring;
    }

    function decodeGeometry(geom: any): any {
      if (geom.type === "Polygon") {
        return {
          type: "Polygon",
          coordinates: geom.arcs.map((ring: number[]) => decodeRing(ring)),
        };
      }
      if (geom.type === "MultiPolygon") {
        return {
          type: "MultiPolygon",
          coordinates: geom.arcs.map((polygon: number[][]) =>
            polygon.map((ring: number[]) => decodeRing(ring))
          ),
        };
      }
      return geom;
    }

    if (obj.type === "GeometryCollection") {
      return obj.geometries.map((g: any) => ({
        type: "Feature",
        properties: g.properties || {},
        geometry: decodeGeometry(g),
      }));
    }

    return [
      {
        type: "Feature",
        properties: obj.properties || {},
        geometry: decodeGeometry(obj),
      },
    ];
  }

  // ---------- Draw ----------
  const draw = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width;
      const h = rect.height;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Background
      ctx.fillStyle = "#05070a";
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = "rgba(0, 242, 255, 0.04)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw countries
      if (geoData) {
        for (const feature of geoData) {
          const name =
            feature.properties?.name ||
            feature.properties?.NAME ||
            feature.properties?.ADMIN ||
            `Country-${feature.properties?.id || ""}`;
          const geom = feature.geometry;
          if (!geom) continue;

          const isHovered = hoveredCountry === name;
          const fill = isHovered
            ? "rgba(0, 242, 255, 0.55)"
            : riskColor(name);

          const polygons =
            geom.type === "Polygon"
              ? [geom.coordinates]
              : geom.type === "MultiPolygon"
              ? geom.coordinates
              : [];

          for (const polygon of polygons) {
            for (const ring of polygon) {
              if (!ring || ring.length < 2) continue;
              ctx.beginPath();
              let first = true;
              for (const coord of ring) {
                const px = mercatorX(coord[0], w);
                const py = mercatorY(coord[1], h);
                if (first) {
                  ctx.moveTo(px, py);
                  first = false;
                } else {
                  ctx.lineTo(px, py);
                }
              }
              ctx.closePath();
              ctx.fillStyle = fill;
              ctx.fill();
              ctx.strokeStyle = isHovered
                ? "rgba(0, 242, 255, 0.8)"
                : "rgba(0, 242, 255, 0.15)";
              ctx.lineWidth = isHovered ? 1.5 : 0.5;
              ctx.stroke();
            }
          }
        }
      }

      // Draw trade arcs between consecutive ports
      const pulse = Math.sin(time / 400) * 0.3 + 0.7;
      if (traffic.ports.length > 1) {
        ctx.setLineDash([4, 6]);
        for (let i = 0; i < traffic.ports.length - 1; i++) {
          const p1 = traffic.ports[i];
          const p2 = traffic.ports[i + 1];
          const x1 = mercatorX(p1.lng, w);
          const y1 = mercatorY(p1.lat, h);
          const x2 = mercatorX(p2.lng, w);
          const y2 = mercatorY(p2.lat, h);
          const mx = (x1 + x2) / 2;
          const my = Math.min(y1, y2) - 30;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo(mx, my, x2, y2);
          ctx.strokeStyle = `rgba(0, 242, 255, ${0.15 * pulse})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // Draw ships
      for (const ship of traffic.ships) {
        const sx = mercatorX(ship.lng, w);
        const sy = mercatorY(ship.lat, h);
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fillStyle =
          ship.risk === "High"
            ? "rgba(255, 0, 92, 0.7)"
            : ship.risk === "Medium"
            ? "rgba(255, 170, 0, 0.6)"
            : "rgba(0, 242, 255, 0.35)";
        ctx.fill();
      }

      // Draw flights
      for (const flight of traffic.flights) {
        const fx = mercatorX(flight.lng, w);
        const fy = mercatorY(flight.lat, h);
        ctx.beginPath();
        ctx.arc(fx, fy, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(168, 85, 247, 0.6)";
        ctx.fill();
      }

      // Draw ports with pulsing glow
      for (const port of traffic.ports) {
        const px = mercatorX(port.lng, w);
        const py = mercatorY(port.lat, h);
        const glowR = 8 + Math.sin(time / 300 + px) * 4;

        // Outer glow
        const grd = ctx.createRadialGradient(px, py, 0, px, py, glowR);
        grd.addColorStop(0, "rgba(0, 242, 255, 0.6)");
        grd.addColorStop(1, "rgba(0, 242, 255, 0)");
        ctx.beginPath();
        ctx.arc(px, py, glowR, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Inner dot
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#00f2ff";
        ctx.fill();

        // Label
        ctx.font = "bold 9px Inter, system-ui, sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
        ctx.textAlign = "center";
        ctx.fillText(port.name, px, py - 12);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    },
    [geoData, traffic, hoveredCountry]
  );

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  // ---------- Mouse interaction ----------
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!geoData) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;

      // Check which country the mouse is in
      let found: string | null = null;

      for (const feature of geoData) {
        const name =
          feature.properties?.name ||
          feature.properties?.NAME ||
          feature.properties?.ADMIN ||
          null;
        const geom = feature.geometry;
        if (!geom || !name) continue;

        const polygons =
          geom.type === "Polygon"
            ? [geom.coordinates]
            : geom.type === "MultiPolygon"
            ? geom.coordinates
            : [];

        for (const polygon of polygons) {
          for (const ring of polygon) {
            if (pointInRing(mx, my, ring, w, h)) {
              found = name;
              break;
            }
          }
          if (found) break;
        }
        if (found) break;
      }

      setHoveredCountry(found);
      if (found) {
        setTooltip({ x: mx, y: my, text: found });
      } else {
        setTooltip(null);
      }
    },
    [geoData]
  );

  function pointInRing(
    px: number,
    py: number,
    ring: number[][],
    w: number,
    h: number
  ): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = mercatorX(ring[i][0], w);
      const yi = mercatorY(ring[i][1], h);
      const xj = mercatorX(ring[j][0], w);
      const yj = mercatorY(ring[j][1], h);

      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  return (
    <div ref={containerRef} className="w-full h-full relative min-h-[400px]">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setTooltip(null);
          setHoveredCountry(null);
        }}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-30 pointer-events-none px-3 py-1.5 rounded-lg text-xs font-bold text-white"
          style={{
            left: tooltip.x + 14,
            top: tooltip.y - 10,
            background: "rgba(0, 242, 255, 0.15)",
            border: "1px solid rgba(0, 242, 255, 0.4)",
            backdropFilter: "blur(8px)",
          }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Title badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className="glass-card px-4 py-2 rounded-lg border-cyan-500/30 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
            Global Supply Chain Heatmap
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-[#ff005c] rounded-full" />
          <span className="text-[8px] text-gray-500 uppercase font-bold">
            High Risk
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-[#ff8c00] rounded-full" />
          <span className="text-[8px] text-gray-500 uppercase font-bold">
            Medium Risk
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-[#00f2ff] rounded-full" />
          <span className="text-[8px] text-gray-500 uppercase font-bold">
            Low Risk
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-[#00ff94] rounded-full" />
          <span className="text-[8px] text-gray-500 uppercase font-bold">
            Minimal Risk
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-3 h-1 bg-[#a855f7] rounded-full" />
          <span className="text-[8px] text-gray-500 uppercase font-bold">
            Active Flight
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-[#ffaa00] rounded-full" />
          <span className="text-[8px] text-gray-500 uppercase font-bold">
            Maritime Vessel
          </span>
        </div>
      </div>
    </div>
  );
}
