import React, { useState, useEffect, useRef } from 'react';
import { 
  Building, 
  Layers, 
  CheckCircle2, 
  Home, 
  Car, 
  ChevronRight,
  RotateCw,
  Box
} from 'lucide-react';
import * as THREE from 'three';
import { Contract } from '../types';
import { formatCurrency } from '../utils/formatters';

interface Building3DViewProps {
  contracts: Contract[];
  onSelectContract: (contractId: string) => void;
}

export const Building3DView: React.FC<Building3DViewProps> = ({
  contracts,
  onSelectContract,
}) => {
  const [viewMode, setViewMode] = useState<'3d' | 'plantas'>('3d');
  const [selectedUnitId, setSelectedUnitId] = useState<string>(contracts[0]?.id || '');
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const selectedContract = contracts.find((c) => c.id === selectedUnitId) || contracts[0];

  const totalReceived = selectedContract.installments.reduce(
    (acc, i) => acc + (i.paidAmount || 0),
    0
  );
  const remainingBalance = selectedContract.totalContractedAmount - totalReceived;

  // Renderiza cena Three.js idêntica à de image_c36d2208.png
  useEffect(() => {
    if (viewMode !== '3d' || !canvasContainerRef.current) return;

    const container = canvasContainerRef.current;
    const width = container.clientWidth || 480;
    const height = 340;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Clean light background matching screenshot

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 15, 24);
    camera.lookAt(0, 4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Remove existing children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(12, 20, 15);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
    fillLight.position.set(-15, 10, -10);
    scene.add(fillLight);

    // Ground platform matching the dark circular pedestal in image_c36d2208.png
    const groundGeo = new THREE.CylinderGeometry(8.5, 9, 0.6, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Dark blue pedestal
      roughness: 0.3,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.3;
    scene.add(ground);

    // Building Group
    const buildingGroup = new THREE.Group();
    scene.add(buildingGroup);

    // Materials
    const soldMaterialNavy = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Navy blue sold
      roughness: 0.2,
      metalness: 0.1,
    });

    const activeHighlightMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Sky blue selected
      roughness: 0.1,
      metalness: 0.2,
    });

    const floorAccentMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Emerald accent
      roughness: 0.3,
    });

    // Floor 1: Ap 108
    const f1Geo = new THREE.BoxGeometry(6.5, 2.2, 5.5);
    const f1Mesh = new THREE.Mesh(f1Geo, selectedUnitId === 'ew-ctr-01' ? activeHighlightMat : soldMaterialNavy);
    f1Mesh.position.set(0, 1.1, 0);
    f1Mesh.userData = { id: 'ew-ctr-01' };
    buildingGroup.add(f1Mesh);

    // Floor 2 / 3: Ap 301
    const f3Geo = new THREE.BoxGeometry(6.5, 2.2, 5.5);
    const f3Mesh = new THREE.Mesh(f3Geo, selectedUnitId === 'ew-ctr-02' ? activeHighlightMat : soldMaterialNavy);
    f3Mesh.position.set(0, 3.5, 0);
    f3Mesh.userData = { id: 'ew-ctr-02' };
    buildingGroup.add(f3Mesh);

    // Floor 4: Coberturas (Cob 01 e Cob 04)
    const cob1Geo = new THREE.BoxGeometry(3.1, 2.2, 5.5);
    const cob1Mesh = new THREE.Mesh(cob1Geo, selectedUnitId === 'ew-ctr-03' ? activeHighlightMat : floorAccentMat);
    cob1Mesh.position.set(-1.65, 5.9, 0);
    cob1Mesh.userData = { id: 'ew-ctr-03' };
    buildingGroup.add(cob1Mesh);

    const cob4Geo = new THREE.BoxGeometry(3.1, 2.2, 5.5);
    const cob4Mesh = new THREE.Mesh(cob4Geo, selectedUnitId === 'ew-ctr-04' ? activeHighlightMat : soldMaterialNavy);
    cob4Mesh.position.set(1.65, 5.9, 0);
    cob4Mesh.userData = { id: 'ew-ctr-04' };
    buildingGroup.add(cob4Mesh);

    // Roof Platband
    const roofGeo = new THREE.BoxGeometry(6.8, 0.4, 5.8);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.set(0, 7.2, 0);
    buildingGroup.add(roofMesh);

    // Raycaster for floor click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([f1Mesh, f3Mesh, cob1Mesh, cob4Mesh]);

      if (intersects.length > 0) {
        const targetId = intersects[0].object.userData.id;
        if (targetId) {
          setSelectedUnitId(targetId);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Gentle Auto-Rotation
    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      buildingGroup.rotation.y += 0.004;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 480;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [viewMode, selectedUnitId]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header and Toggle matching image_c36d2208.png */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-900" />
            <h2 className="text-xl font-extrabold text-blue-950 tracking-tight">
              Gestão de Unidades & Visualização 3D
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle de estoque imobiliário, modelo 3D volumétrico interativo e dados financeiros por unidade.
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setViewMode('3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === '3d'
                ? 'bg-blue-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>Modelo 3D</span>
          </button>
          <button
            onClick={() => setViewMode('plantas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'plantas'
                ? 'bg-blue-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Grade de Plantas</span>
          </button>
        </div>
      </div>

      {/* Main 3D Split Section matching image_c36d2208.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: 3D Canvas Box */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
            <div>
              <strong className="text-xs font-black uppercase tracking-wider text-blue-950">
                EDIFÍCIO RESIDENCIAL — PRÉDIO EW
              </strong>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-950">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-900 inline-block"></span>
                <span>Vendida</span>
              </span>
              <span className="flex items-center gap-1.5 text-sky-600">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-500 inline-block"></span>
                <span>Selecionada</span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span>
                <span>Amortizada</span>
              </span>
            </div>
          </div>

          {/* Three.js Interactive Viewport */}
          <div
            ref={canvasContainerRef}
            className="w-full h-80 rounded-xl overflow-hidden cursor-pointer relative bg-slate-50 flex items-center justify-center border border-slate-100"
          />

          <div className="pt-3 text-[11px] text-center text-slate-500 font-medium">
            Toque ou clique em qualquer pavimento para selecionar a unidade
          </div>
        </div>

        {/* Right: FICHA DA UNIDADE Card matching screenshot */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  FICHA DA UNIDADE
                </span>
                <h3 className="text-xl font-black text-blue-950">
                  {selectedContract.unit.unitNumber}
                </h3>
                <span className="text-xs text-slate-500">
                  {selectedContract.unit.type === 'cobertura' ? 'Cobertura Duplex' : 'Apartamento'} • {selectedContract.unit.bedrooms} Quartos ({selectedContract.unit.suites} Suíte)
                </span>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                VENDIDA
              </span>
            </div>

            <div className="space-y-3.5 pt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Valor de Venda</span>
                <strong className="text-base font-black text-blue-950 font-mono-numbers">
                  {formatCurrency(selectedContract.totalContractedAmount)}
                </strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Comprador</span>
                <strong className="text-slate-900 font-bold text-right max-w-[180px] truncate">
                  {selectedContract.buyer.name}
                </strong>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl flex items-center justify-between border border-emerald-100">
                <span className="text-emerald-800 font-semibold">Total Recebido</span>
                <span className="text-emerald-700 font-black font-mono-numbers text-sm">
                  {formatCurrency(totalReceived)}
                </span>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl flex items-center justify-between border border-sky-100">
                <span className="text-sky-800 font-semibold">Saldo a Receber</span>
                <span className="text-sky-700 font-black font-mono-numbers text-sm">
                  {formatCurrency(remainingBalance)}
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                <div>
                  <strong>Localização:</strong> {selectedContract.unit.position}
                </div>
                <div>
                  <strong>Garagem:</strong> {selectedContract.unit.carParkingSpaces > 0 ? `${selectedContract.unit.carParkingSpaces} Vaga Auto` : 'Sem vaga de garagem'}
                  {selectedContract.unit.motorcycleParkingSpaces > 0 ? ' • Espaço moto' : ''}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Andar: <strong className="text-slate-800">{selectedContract.unit.type === 'cobertura' ? '4º Pavimento' : selectedContract.unit.unitNumber.includes('301') ? '3º Pavimento' : '1º Pavimento'}</strong>
            </span>
            <button
              onClick={() => onSelectContract(selectedContract.id)}
              className="text-blue-900 hover:text-blue-700 font-bold flex items-center gap-1"
            >
              <span>Ver Dossiê</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Table: UNIDADES DAS OPERAÇÕES OFICIAIS matching screenshot */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-blue-950 uppercase tracking-wide">
              UNIDADES DAS OPERAÇÕES OFICIAIS ({contracts.length} UNIDADES FORNECIDAS)
            </h3>
            <p className="text-xs text-slate-500">
              Exibindo exclusivamente as unidades com contratos cadastrados no PRÉDIO EW.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">UNIDADE</th>
                <th className="px-5 py-3">EMPREENDIMENTO</th>
                <th className="px-5 py-3">TIPOLOGIA / POSIÇÃO</th>
                <th className="px-5 py-3">COMPRADOR</th>
                <th className="px-5 py-3 text-right">VALOR DE VENDA</th>
                <th className="px-5 py-3 text-right">TOTAL RECEBIDO</th>
                <th className="px-5 py-3 text-right">SALDO A RECEBER</th>
                <th className="px-5 py-3 text-center">STATUS</th>
                <th className="px-5 py-3 text-center">AÇÃO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {contracts.map((c) => {
                const rec = c.installments.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
                const bal = c.totalContractedAmount - rec;
                const isSelected = c.id === selectedUnitId;

                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedUnitId(c.id)}
                    className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                      isSelected ? 'bg-sky-50/50' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5 font-black text-blue-950">
                      {c.unit.unitNumber}
                    </td>

                    <td className="px-5 py-3.5 font-medium text-slate-700">
                      PRÉDIO EW
                    </td>

                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {c.unit.position}
                    </td>

                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {c.buyer.name}
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono-numbers font-black text-slate-900">
                      {formatCurrency(c.totalContractedAmount)}
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono-numbers font-bold text-emerald-600">
                      {formatCurrency(rec)}
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono-numbers font-bold text-sky-700">
                      {formatCurrency(bal)}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        Vendida
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedUnitId(c.id)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-blue-950 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'Ativa' : 'Selecionar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
