// 3D AR Agent Scene using Three.js and React Three Fiber

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { DeployedAgent } from "../types";
import { Agent3D } from "./Agent3D";

interface AgentSceneProps {
  agents: DeployedAgent[];
  onAgentClick: (agent: DeployedAgent) => void;
}

export function AgentScene({ agents, onAgentClick }: AgentSceneProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas camera={{ position: [0, 2, 5], fov: 75 }} className="pointer-events-auto">
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {/* Render agents */}
        {agents.map((agent) => (
          <Agent3D key={agent.id} agent={agent} onClick={() => onAgentClick(agent)} />
        ))}

        {/* Camera controls */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
