"use client"

import { OrbitControls, Line } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useMemo } from "react"

import type { NewsInsight } from "@/lib/api/schemas"

type Props = {
  insight: NewsInsight
  activeNodeId: string | null
  onNodeSelect: (nodeId: string) => void
}

type PositionedNode = NewsInsight["graph"]["nodes"][number] & {
  position: [number, number, number]
}

const COLORS: Record<string, string> = {
  story: "#A594F9",
  sector: "#F8F9FF",
  asset: "#4B3F72",
}

function directionColor(direction: string, kind: string) {
  if (direction === "up") return "#22c55e"
  if (direction === "down") return "#ef4444"
  return COLORS[kind] || "#94a3b8"
}

function NodeMesh({
  node,
  active,
  onClick,
}: {
  node: PositionedNode
  active: boolean
  onClick: () => void
}) {
  const radius = 0.18 + node.impact * 0.45
  return (
    <group position={node.position}>
      <mesh onClick={onClick}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color={directionColor(node.direction, node.kind)} emissive={active ? "#bfdbfe" : "#111827"} emissiveIntensity={active ? 1.2 : 0.3} />
      </mesh>
      <mesh position={[0, radius + 0.22, 0]}>
        <planeGeometry args={[1.8, 0.45]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.72} />
      </mesh>
    </group>
  )
}

export default function SignalSphere({ insight, activeNodeId, onNodeSelect }: Props) {
  const positionedNodes = useMemo<PositionedNode[]>(() => {
    const storyNodes = insight.graph.nodes.filter((node) => node.kind === "story")
    const sectorNodes = insight.graph.nodes.filter((node) => node.kind === "sector")
    const assetNodes = insight.graph.nodes.filter((node) => node.kind !== "story" && node.kind !== "sector")

    const polar = (radius: number, index: number, total: number): [number, number, number] => {
      const angle = (Math.PI * 2 * index) / Math.max(total, 1)
      return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]
    }

    return [
      ...storyNodes.map((node) => ({ ...node, position: [0, 0, 0] as [number, number, number] })),
      ...sectorNodes.map((node, index) => ({ ...node, position: polar(1.8, index, sectorNodes.length) })),
      ...assetNodes.map((node, index) => ({ ...node, position: polar(3.3, index, assetNodes.length) })),
    ]
  }, [insight.graph.nodes])

  const edges = insight.graph.edges
    .map((edge) => {
      const source = positionedNodes.find((node) => node.id === edge.source)
      const target = positionedNodes.find((node) => node.id === edge.target)
      if (!source || !target) return null
      return {
        ...edge,
        points: [source.position, target.position] as [[number, number, number], [number, number, number]],
      }
    })
    .filter(Boolean)

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#020617]/80">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.18),transparent_55%)]" />
      <Canvas camera={{ position: [0, 3.6, 7.2], fov: 45 }}>
        <ambientLight intensity={1.0} />
        <pointLight position={[6, 6, 6]} intensity={14} color="#60a5fa" />
        <pointLight position={[-6, -4, -6]} intensity={8} color="#22d3ee" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]}>
          <ringGeometry args={[1.68, 1.72, 64]} />
          <meshBasicMaterial color="#A594F9" transparent opacity={0.35} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.38, 0]}>
          <ringGeometry args={[3.18, 3.22, 64]} />
          <meshBasicMaterial color="#4B3F72" transparent opacity={0.45} />
        </mesh>
        {edges.map((edge) => (
          <Line
            key={`${edge?.source}-${edge?.target}`}
            points={edge?.points ?? []}
            color="#8d83b6"
            lineWidth={Math.max(1, ((edge?.weight ?? 0.2) * 2.5))}
            transparent
            opacity={0.85}
          />
        ))}
        {positionedNodes.map((node) => (
          <NodeMesh
            key={node.id}
            node={node}
            active={activeNodeId === node.id}
            onClick={() => onNodeSelect(node.id)}
          />
        ))}
        <OrbitControls enablePan={false} maxDistance={8.5} minDistance={5.5} autoRotate autoRotateSpeed={0.7} />
      </Canvas>
      <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-[#D9D3FF]">
        Signal Sphere
      </div>
    </div>
  )
}
