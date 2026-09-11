"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html, Stars } from "@react-three/drei";
import * as THREE from "three";

// ── Types ──
interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;
  label: string;
  type: string;
  risk: string;
  details: {
    category: string;
    status: string;
    throughput: string;
    congestion: string;
    riskFactors: string[];
    lastUpdated: string;
  };
}

interface InfoPanelData {
  position: [number, number, number];
  point: HeatPoint;
}

// ── Lat/Lng to 3D sphere ──
function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ── Generate heat points ──
function generateHeatPoints(): HeatPoint[] {
  const hubs: Omit<HeatPoint, "details">[] = [
    { lat: 31.22, lng: 121.48, intensity: 0.95, label: "Shanghai Port", type: "port", risk: "High" },
    { lat: 1.29, lng: 103.85, intensity: 0.88, label: "Singapore Hub", type: "port", risk: "Medium" },
    { lat: 51.92, lng: 4.48, intensity: 0.72, label: "Rotterdam", type: "port", risk: "Low" },
    { lat: 34.05, lng: -118.24, intensity: 0.81, label: "Los Angeles", type: "port", risk: "Medium" },
    { lat: 25.20, lng: 55.27, intensity: 0.77, label: "Dubai Logistics", type: "port", risk: "Low" },
    { lat: 35.67, lng: 139.65, intensity: 0.85, label: "Tokyo Industrial", type: "manufacturing", risk: "Medium" },
    { lat: 22.32, lng: 114.17, intensity: 0.92, label: "Hong Kong Trade", type: "trade", risk: "High" },
    { lat: 18.96, lng: 72.83, intensity: 0.68, label: "Mumbai Port", type: "port", risk: "Medium" },
    { lat: 40.71, lng: -74.00, intensity: 0.79, label: "New York Finance", type: "finance", risk: "Low" },
    { lat: 53.55, lng: 9.99, intensity: 0.65, label: "Hamburg Port", type: "port", risk: "Low" },
    { lat: -23.96, lng: -46.33, intensity: 0.58, label: "Santos Export", type: "port", risk: "Medium" },
    { lat: 37.57, lng: 127.0, intensity: 0.91, label: "Seoul Semiconductor", type: "manufacturing", risk: "High" },
    { lat: 24.47, lng: 54.37, intensity: 0.63, label: "Abu Dhabi Energy", type: "energy", risk: "Low" },
    { lat: 51.51, lng: -0.13, intensity: 0.74, label: "London Finance", type: "finance", risk: "Low" },
    { lat: 13.76, lng: 100.50, intensity: 0.70, label: "Bangkok Manufacturing", type: "manufacturing", risk: "Medium" },
    { lat: -33.87, lng: 151.21, intensity: 0.52, label: "Sydney Trade", type: "trade", risk: "Low" },
    { lat: 29.76, lng: -95.37, intensity: 0.83, label: "Houston Energy", type: "energy", risk: "High" },
    { lat: 39.91, lng: 116.40, intensity: 0.89, label: "Beijing Industrial", type: "manufacturing", risk: "High" },
    { lat: 12.97, lng: 77.59, intensity: 0.73, label: "Bangalore Tech", type: "manufacturing", risk: "Medium" },
    { lat: 48.86, lng: 2.35, intensity: 0.60, label: "Paris Logistics", type: "trade", risk: "Low" },
  ];

  const statuses = ["Operational", "Under Stress", "Critical", "Monitoring"];
  const riskFactorPool = [
    "Geopolitical tension", "Weather disruption", "Labor shortage",
    "Capacity overflow", "Regulatory change", "Demand spike",
    "Fuel cost surge", "Port congestion", "Cyber threat", "Currency volatility"
  ];

  return hubs.map((h) => {
    const riskFactors: string[] = [];
    for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
      const rf = riskFactorPool[Math.floor(Math.random() * riskFactorPool.length)];
      if (!riskFactors.includes(rf)) riskFactors.push(rf);
    }
    return {
      ...h,
      details: {
        category: h.type.charAt(0).toUpperCase() + h.type.slice(1),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        throughput: `${(Math.random() * 50 + 50).toFixed(1)}K TEU/day`,
        congestion: `${Math.floor(Math.random() * 100)}%`,
        riskFactors,
        lastUpdated: new Date().toLocaleTimeString(),
      },
    };
  });
}

// ---------- TopoJSON → GeoJSON converter ----------
function topoToGeo(topology: any, objectName: string) {
  const obj = topology.objects[objectName];
  if (!obj) return [];

  const arcsData: number[][][] = topology.arcs;
  const transform = topology.transform;

  function decodeArc(arcIdx: number): number[][] {
    const isReverse = arcIdx < 0;
    const idx = isReverse ? ~arcIdx : arcIdx;
    const arc = arcsData[idx];
    const coords: number[][] = [];
    let x = 0, y = 0;
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


// ── Country Borders ──
function GlobeBorders() {
  const [borders, setBorders] = useState<THREE.BufferGeometry[]>([]);

  useEffect(() => {
    fetch("https://unpkg.com/world-atlas@2/countries-110m.json")
      .then(r => r.json())
      .then(topo => {
        const features = topoToGeo(topo, "countries");
        const geoms: THREE.BufferGeometry[] = [];
        
        for (const feature of features) {
          const geom = feature.geometry;
          if (!geom) continue;
          
          const polygons = geom.type === "Polygon" ? [geom.coordinates] : geom.type === "MultiPolygon" ? geom.coordinates : [];
          
          for (const poly of polygons) {
            for (const ring of poly) {
              const points: THREE.Vector3[] = [];
              for (const coord of ring) {
                // GeoJSON uses [lng, lat]
                points.push(latLngToVec3(coord[1], coord[0], 2.001));
              }
              if (points.length > 1) {
                geoms.push(new THREE.BufferGeometry().setFromPoints(points));
              }
            }
          }
        }
        setBorders(geoms);
      })
      .catch(console.error);
  }, []);

  const borderLines = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: "#00f2ff",
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });
    return borders.map((g) => new THREE.Line(g, mat));
  }, [borders]);

  return (
    <group>
      {borderLines.map((lineObj, i) => (
        <primitive key={i} object={lineObj} />
      ))}
    </group>
  );
}

// ── Atmosphere shader ──
function Atmosphere() {
  const geo = useMemo(() => new THREE.SphereGeometry(2.08, 64, 64), []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
            gl_FragColor = vec4(0.0, 0.85, 1.0, 1.0) * intensity * 0.5;
          }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
      }),
    []
  );
  return <mesh geometry={geo} material={mat} />;
}

// ── Arcs & Connections ──
function NetworkArcs({ points }: { points: HeatPoint[] }) {
  const lines = useMemo(() => {
    const arr = [];
    const colorOpts = ["#ff005c", "#ff8c00", "#00f2ff", "#a855f7"];
    for (let i = 0; i < 60; i++) {
      const p1 = points[Math.floor(Math.random() * points.length)];
      const p2 = points[Math.floor(Math.random() * points.length)];
      if (p1 === p2) continue;
      
      const v1 = latLngToVec3(p1.lat, p1.lng, 2.0);
      const v2 = latLngToVec3(p2.lat, p2.lng, 2.0);
      
      const dist = v1.distanceTo(v2);
      const mid = v1.clone().lerp(v2, 0.5);
      // Elevate the midpoint based on distance
      mid.normalize().multiplyScalar(2.0 + dist * 0.3); 
      
      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
      const curvePoints = curve.getPoints(30);
      const geom = new THREE.BufferGeometry().setFromPoints(curvePoints);
      
      const color = colorOpts[Math.floor(Math.random() * colorOpts.length)];
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
      });
      const lineObj = new THREE.Line(geom, mat);

      arr.push({
        geom,
        color,
        lineObj,
        start: v1,
        end: v2,
        curve,
        speed: Math.random() * 0.5 + 0.2,
        offset: Math.random()
      });
    }
    return arr;
  }, [points]);

  return (
    <group>
      {lines.map((line, i) => (
        <group key={i}>
          {/* Faint arc line */}
          <primitive object={line.lineObj} />
          {/* Animated particle along arc */}
          <ArcParticle curve={line.curve} color={line.color} speed={line.speed} offset={line.offset} />
        </group>
      ))}
    </group>
  );
}

function ArcParticle({ curve, color, speed, offset }: { curve: THREE.QuadraticBezierCurve3, color: string, speed: number, offset: number }) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current) {
      const t = (state.clock.elapsedTime * speed + offset) % 1;
      const pos = curve.getPointAt(t);
      ref.current.position.copy(pos);
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.015, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

// ── Glowing Node ──
function HeatNode({
  point,
  onClick,
  isSelected,
}: {
  point: HeatPoint;
  onClick: (p: HeatPoint, pos: [number, number, number]) => void;
  isSelected: boolean;
}) {
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const pos = useMemo(() => latLngToVec3(point.lat, point.lng, 2.01), [point]);

  const color = useMemo(() => {
    if (point.risk === "High") return new THREE.Color("#ff005c");
    if (point.risk === "Medium") return new THREE.Color("#ff8c00");
    return new THREE.Color("#00f2ff");
  }, [point.risk]);

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 3 + point.intensity * 10) * 0.2 + 0.8;
      glowRef.current.scale.setScalar(pulse * (hovered || isSelected ? 1.5 : 1));
    }
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick(point, [pos.x, pos.y, pos.z]);
  }, [point, pos, onClick]);

  const handleOver = useCallback(() => setHovered(true), []);
  const handleOut = useCallback(() => setHovered(false), []);

  return (
    <group position={pos}>
      {/* Invisible wider hitbox */}
      <mesh onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Core bright dot */}
      <mesh>
        <sphereGeometry args={[0.015, 16, 16]} />
        <meshBasicMaterial color={"#ffffff"} />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Hover label */}
      {hovered && !isSelected && (
        <Html center style={{ pointerEvents: "none" }} position={[0, 0.05, 0]}>
          <div
            style={{
              background: "rgba(5,7,10,0.92)",
              border: "1px solid rgba(0,242,255,0.5)",
              borderRadius: 8,
              padding: "6px 12px",
              whiteSpace: "nowrap",
              backdropFilter: "blur(12px)",
              transform: 'translateY(-20px)',
            }}
          >
            <span style={{ color: "#00f2ff", fontSize: 11, fontWeight: 800 }}>{point.label}</span>
            <span
              style={{
                marginLeft: 8,
                fontSize: 10,
                fontWeight: 700,
                color: point.risk === "High" ? "#ff005c" : point.risk === "Medium" ? "#ff8c00" : "#00ff94",
              }}
            >
              {point.risk} Risk
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Globe mesh ──
function Globe({
  onPointClick,
  selectedPoint,
}: {
  onPointClick: (p: HeatPoint, pos: [number, number, number]) => void;
  selectedPoint: HeatPoint | null;
}) {
  const globeRef = useRef<THREE.Group>(null);
  const heatPoints = useMemo(() => generateHeatPoints(), []);

  useFrame(() => {
    if (globeRef.current && !selectedPoint) {
      globeRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <group ref={globeRef}>
      {/* Solid dark globe */}
      <mesh>
        <sphereGeometry args={[1.98, 64, 64]} />
        <meshStandardMaterial color="#020813" roughness={0.9} metalness={0.5} />
      </mesh>

      <GlobeBorders />
      <Atmosphere />
      <NetworkArcs points={heatPoints} />

      {/* Heat nodes */}
      {heatPoints.map((point, i) => (
        <HeatNode
          key={i}
          point={point}
          onClick={onPointClick}
          isSelected={selectedPoint?.label === point.label}
        />
      ))}
    </group>
  );
}

// ── Scene wrapper ──
function Scene({
  onPointClick,
  selectedPoint,
}: {
  onPointClick: (p: HeatPoint, pos: [number, number, number]) => void;
  selectedPoint: HeatPoint | null;
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-10, -5, 5]} intensity={1.0} color="#00f2ff" />
      <Stars radius={100} depth={60} count={3000} factor={3} saturation={0} fade speed={1.5} />
      <Globe onPointClick={onPointClick} selectedPoint={selectedPoint} />
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={8}
        autoRotate={!selectedPoint}
        autoRotateSpeed={0.5}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

// ── Info Panel (HTML overlay) ──
function InfoPanel({
  data,
  onClose,
}: {
  data: InfoPanelData;
  onClose: () => void;
}) {
  const point = data.point;
  const d = point.details;

  const riskColors: Record<string, string> = {
    High: "#ff005c",
    Medium: "#ff8c00",
    Low: "#00ff94",
  };
  const riskBg: Record<string, string> = {
    High: "rgba(255,0,92,0.15)",
    Medium: "rgba(255,140,0,0.15)",
    Low: "rgba(0,255,148,0.15)",
  };

  return (
    <div
      style={{
        position: "absolute",
        right: 20,
        top: 20,
        width: 340,
        background: "rgba(5,7,10,0.95)",
        border: "1px solid rgba(0,242,255,0.3)",
        borderRadius: 16,
        padding: 24,
        backdropFilter: "blur(20px)",
        zIndex: 50,
        fontFamily: "Inter, system-ui, sans-serif",
        animation: "slideIn 0.3s ease-out",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 800, margin: 0 }}>{point.label}</h3>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#00f2ff",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            {d.category} Node
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "#fff",
            width: 28,
            height: 28,
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>

      {/* Risk badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: riskBg[point.risk],
          border: `1px solid ${riskColors[point.risk]}40`,
          borderRadius: 8,
          padding: "4px 12px",
          marginBottom: 16,
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: riskColors[point.risk] }} />
        <span style={{ color: riskColors[point.risk], fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {point.risk} Risk — {d.status}
        </span>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Intensity", value: `${(point.intensity * 100).toFixed(0)}%` },
          { label: "Congestion", value: d.congestion },
          { label: "Throughput", value: d.throughput },
          { label: "Coordinates", value: `${point.lat.toFixed(1)}°, ${point.lng.toFixed(1)}°` },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 10,
              padding: "10px 12px",
            }}
          >
            <div style={{ color: "#6b7280", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
              {s.label}
            </div>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Risk factors */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: "#6b7280", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          Active Risk Factors
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {d.riskFactors.map((rf) => (
            <span
              key={rf}
              style={{
                background: "rgba(0,242,255,0.08)",
                border: "1px solid rgba(0,242,255,0.2)",
                borderRadius: 6,
                padding: "3px 8px",
                fontSize: 10,
                fontWeight: 600,
                color: "#00f2ff",
              }}
            >
              {rf}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#4b5563", fontSize: 9, fontWeight: 600 }}>Last updated: {d.lastUpdated}</span>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff94", boxShadow: "0 0 8px rgba(0,255,148,0.5)" }} />
      </div>
    </div>
  );
}

// ── Main Component ──
export default function WorldMap3D() {
  const [selected, setSelected] = useState<InfoPanelData | null>(null);

  const handlePointClick = useCallback((point: HeatPoint, pos: [number, number, number]) => {
    setSelected({ position: pos, point });
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", minHeight: 400 }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} style={{ background: "#05070a" }}>
        <Scene onPointClick={handlePointClick} selectedPoint={selected?.point || null} />
      </Canvas>

      {/* Info panel */}
      {selected && <InfoPanel data={selected} onClose={() => setSelected(null)} />}

      {/* Title badge */}
      <div style={{ position: "absolute", top: 16, left: 16, zIndex: 10 }}>
        <div
          style={{
            background: "rgba(15,20,28,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(0,242,255,0.3)",
            borderRadius: 10,
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00f2ff", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: "#00f2ff", textTransform: "uppercase", letterSpacing: "0.2em" }}>
            3D Global Network
          </span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ position: "absolute", bottom: 16, right: 16, zIndex: 10, display: "flex", flexDirection: "column", gap: 4 }}>
        {[
          { color: "#ff005c", label: "High Risk" },
          { color: "#ff8c00", label: "Medium Risk" },
          { color: "#00f2ff", label: "Low Risk" },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 4, background: l.color, borderRadius: 2 }} />
            <span style={{ fontSize: 8, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div style={{ position: "absolute", bottom: 16, left: 16, zIndex: 10 }}>
        <span style={{ fontSize: 9, color: "#4b5563", fontWeight: 600 }}>
          Click any node for details • Scroll to zoom • Drag to rotate
        </span>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
