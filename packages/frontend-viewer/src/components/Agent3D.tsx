// Individual 3D Agent component with hover effects and click detection

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import type { Mesh } from "three";
import type { DeployedAgent } from "../types";

interface Agent3DProps {
  agent: DeployedAgent;
  onClick: () => void;
}

export function Agent3D({ agent, onClick }: Agent3DProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [scale, setScale] = useState(1);

  // Animate agent (floating effect)
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = agent.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;

      // Smooth scale transition
      const targetScale = hovered ? 1.2 : 1;
      setScale((prev) => prev + (targetScale - prev) * 0.1);
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  // Get color based on agent template type
  const getAgentColor = () => {
    switch (agent.templateId) {
      case "buy_button":
        return "#8b5cf6"; // Purple
      case "challenge_giver":
        return "#f59e0b"; // Amber
      case "predictor":
        return "#3b82f6"; // Blue
      case "leaderboard":
        return "#10b981"; // Green
      default:
        return "#8b5cf6";
    }
  };

  return (
    <group position={agent.position}>
      {/* Main agent mesh */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        {/* Sphere geometry for simple agent representation */}
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={getAgentColor()}
          emissive={getAgentColor()}
          emissiveIntensity={hovered ? 0.5 : 0.2}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Glow effect when hovered */}
      {hovered && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshBasicMaterial color={getAgentColor()} transparent opacity={0.3} />
        </mesh>
      )}

      {/* Agent name label */}
      <Text
        position={[0, 1, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {agent.name}
      </Text>

      {/* Quick buy indicator */}
      {agent.config.quickBuyEnabled && (
        <Text
          position={[0, -0.8, 0]}
          fontSize={0.15}
          color="#10b981"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          Quick Buy
        </Text>
      )}

      {/* Interaction ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <ringGeometry args={[0.6, 0.7, 32]} />
        <meshBasicMaterial color={getAgentColor()} transparent opacity={hovered ? 0.6 : 0.3} />
      </mesh>
    </group>
  );
}
