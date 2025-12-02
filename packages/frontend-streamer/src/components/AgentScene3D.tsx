import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Box, Sphere } from "@react-three/drei";
import type { DeployedAgent } from "../types";

interface Agent3DProps {
  agent: DeployedAgent;
  onSelect: (agent: DeployedAgent) => void;
  isSelected: boolean;
}

function Agent3D({ agent, onSelect, isSelected }: Agent3DProps) {
  const meshRef = useRef<any>();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      if (hovered || isSelected) {
        meshRef.current.position.y =
          agent.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      } else {
        meshRef.current.position.y = agent.position[1];
      }
    }
  });

  return (
    <group position={agent.position}>
      <Sphere
        ref={meshRef}
        args={[0.5, 32, 32]}
        onClick={() => onSelect(agent)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={isSelected ? "#ec4899" : hovered ? "#a855f7" : "#8b5cf6"}
          emissive={isSelected ? "#ec4899" : hovered ? "#a855f7" : "#8b5cf6"}
          emissiveIntensity={0.5}
        />
      </Sphere>
      {/* Agent name label */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} />
      </mesh>
    </group>
  );
}

interface AgentScene3DProps {
  agents: DeployedAgent[];
  onAgentSelect: (agent: DeployedAgent) => void;
  selectedAgentId: string | null;
}

export default function AgentScene3D({
  agents,
  onAgentSelect,
  selectedAgentId,
}: AgentScene3DProps) {
  return (
    <div className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />

        {/* Ground plane */}
        <Box args={[20, 0.1, 20]} position={[0, -0.5, 0]}>
          <meshStandardMaterial color="#1f2937" />
        </Box>

        {/* Agents */}
        {agents.map((agent) => (
          <Agent3D
            key={agent.id}
            agent={agent}
            onSelect={onAgentSelect}
            isSelected={agent.id === selectedAgentId}
          />
        ))}

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={20}
        />
      </Canvas>
    </div>
  );
}
