/**
 * SafeStep — Interactive Road Safety Map
 *
 * Uses Leaflet with OpenStreetMap, Esri Satellite, and CartoDB Dark tiles.
 * Supports real-time GPS tracking, Overpass road corridors, dynamic conflict locus
 * perimeters (Green/Orange/Red), municipal hazard zones, crosswalks, accuracy circles,
 * position history trails, and smooth orientation markers.
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Crosshair, Navigation, AlertCircle, Eye, EyeOff, AlertTriangle, Volume2, Zap, Car } from 'lucide-react';
import { useSafety } from '../../context/SafetyContext';
import { MAP_CENTER, NAGPUR_LANDMARKS } from '../../services/MockData';

// Custom Nagpur Landmark Pin Icon
function createLandmarkIcon(name: string, category: string) {
  const iconEmoji =
    category === 'transit'
      ? '🚆'
      : category === 'heritage'
      ? '🏛️'
      : category === 'crossing'
      ? '🚶'
      : category === 'civic'
      ? '🔬'
      : '📍';

  return L.divIcon({
    className: 'custom-nagpur-landmark-marker',
    html: `
      <div style="display: flex; align-items: center; gap: 4px; background: rgba(255,255,255,0.92); backdrop-filter: blur(4px); padding: 2px 7px; border-radius: 9999px; border: 1px solid #cbd5e1; box-shadow: 0 1px 4px rgba(0,0,0,0.15); white-space: nowrap; font-size: 11px; font-weight: 700; color: #1e293b; pointer-events: auto;">
        <span>${iconEmoji}</span>
        <span>${name}</span>
      </div>
    `,
    iconSize: [110, 24],
    iconAnchor: [55, 12],
  });
}

// Custom Collision Impact Marker Icon
function createCollisionMarkerIcon() {
  return L.divIcon({
    className: 'custom-collision-marker',
    html: `
      <div style="position: relative; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: -12px; border-radius: 9999px; background: rgba(239, 68, 68, 0.4); animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; inset: -5px; border-radius: 9999px; border: 3px solid #dc2626; background: rgba(220, 38, 38, 0.3);"></div>
        <div style="width: 38px; height: 38px; background: #dc2626; border: 2.5px solid #ffffff; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(220, 38, 38, 0.9); color: white; font-size: 19px;">
          💥
        </div>
        <div style="position: absolute; bottom: -8px; background: #7f1d1d; color: #ffffff; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 4px; border: 1.5px solid white; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.5); letter-spacing: 0.5px;">
          COLLISION
        </div>
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
}

// Custom Crossing Beacon Marker Icon
function createCrossingBeaconIcon(status: string) {
  const isStopped = status === 'vehicle_stopped';
  const isSlowing = status === 'vehicle_slowing';
  const bgColor = isStopped ? '#10b981' : isSlowing ? '#f59e0b' : '#2563eb';
  const label = isStopped ? 'STOPPED' : isSlowing ? 'SLOWING' : 'REQUEST';

  return L.divIcon({
    className: 'custom-crossing-beacon-marker',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: -8px; border-radius: 9999px; background: ${bgColor}44; animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 32px; height: 32px; background: ${bgColor}; border: 2.5px solid #ffffff; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px ${bgColor}88; color: white; font-size: 15px;">
          🚶
        </div>
        <div style="position: absolute; bottom: -8px; background: #0f172a; color: #ffffff; font-size: 8px; font-weight: 800; padding: 1px 5px; border-radius: 4px; border: 1px solid white; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.4); letter-spacing: 0.5px;">
          ${label}
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

// Custom SVG HTML Icons for Leaflet
function createVehicleIcon(headingDeg: number, isBraking: boolean, riskLevel: string, speedKmh: number) {
  const borderColor = riskLevel === 'red' ? '#ef4444' : riskLevel === 'yellow' ? '#f59e0b' : '#3b82f6';
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
        ${riskLevel === 'red' ? '<div style="position: absolute; inset: -8px; border-radius: 9999px; background: rgba(239, 68, 68, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
        <div style="transform: rotate(${headingDeg}deg); width: 36px; height: 36px; background: #0f172a; border: 2.5px solid ${borderColor}; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.35); color: white;">
          <!-- Vehicle Direction Arrow -->
          <div style="position: absolute; top: -7px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 7px solid ${borderColor};"></div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
        ${isBraking ? '<div style="position: absolute; bottom: -2px; padding: 1px 4px; background: #ef4444; border-radius: 4px; font-size: 8px; font-weight: bold; color: white;">BRAKE</div>' : ''}
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

function createPedestrianIcon(profile: string, riskLevel: string, headingDeg?: number | null) {
  const haloColor =
    riskLevel === 'red' ? '#ef4444' : riskLevel === 'yellow' ? '#f59e0b' : '#10b981';
  const bg = riskLevel === 'red' ? '#b91c1c' : riskLevel === 'yellow' ? '#d97706' : '#059669';

  const iconSvg =
    profile === 'wheelchair'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="4" r="2"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><circle cx="10" cy="17" r="5"/><path d="M10 12h5"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="5" r="1.5"/><path d="m9 20 3-6 3 6"/><path d="m6 8 6 2 6-2"/><path d="M12 10v4"/></svg>`;

  const headingPointer = headingDeg !== null && headingDeg !== undefined
    ? `<div style="position: absolute; top: -7px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 7px solid #2563eb;"></div>`
    : '';

  const rotationStyle = headingDeg !== null && headingDeg !== undefined ? `transform: rotate(${headingDeg}deg);` : '';

  return L.divIcon({
    className: 'custom-pedestrian-marker',
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; ${rotationStyle}">
        ${headingPointer}
        <div style="position: absolute; inset: -4px; border-radius: 9999px; border: 2px solid ${haloColor}; opacity: 0.7;"></div>
        <div style="width: 30px; height: 30px; background: ${bg}; border: 2px solid #ffffff; border-radius: 9999px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.25);">
          ${iconSvg}
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function createCrosswalkIcon(isWheelchair: boolean, type: string) {
  return L.divIcon({
    className: 'custom-crosswalk-marker',
    html: `
      <div style="width: 28px; height: 28px; background: #ffffff; border: 2px solid #0284c7; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createConflictPointIcon(level: string) {
  const color = level === 'red' ? '#ef4444' : level === 'yellow' ? '#f59e0b' : '#10b981';
  return L.divIcon({
    className: 'conflict-locus-marker',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: -6px; border-radius: 9999px; border: 2px dashed ${color}; animation: spin 8s linear infinite;"></div>
        <div style="width: 18px; height: 18px; background: ${color}; border: 2.5px solid #ffffff; border-radius: 9999px; box-shadow: 0 0 12px ${color};"></div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

const TILE_LAYERS = {
  standard: {
    name: 'Google Maps Style (Voyager)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  osm: {
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  satellite: {
    name: 'Satellite (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    },
  },
  dark: {
    name: 'Dark (CartoDB)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
};

type MapLayerType = 'standard' | 'osm' | 'satellite' | 'dark';

interface SafetyMapProps {
  interactiveHeight?: string;
  onSelectPedestrian?: () => void;
  showConflictZones?: boolean;
}

export const SafetyMap: React.FC<SafetyMapProps> = ({
  interactiveHeight = 'h-[520px]',
  onSelectPedestrian,
  showConflictZones = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);

  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const pedestrianMarkerRef = useRef<L.Marker | null>(null);
  const conflictMarkerRef = useRef<L.Marker | null>(null);
  const dynamicConflictZoneRef = useRef<L.Circle | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const liveRoadCorridorRef = useRef<L.Polyline | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const trailPolylineRef = useRef<L.Polyline | null>(null);
  const hazardLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const crosswalkLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const trafficLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const collisionMarkerRef = useRef<L.Marker | null>(null);
  const crossingBeaconMarkerRef = useRef<L.Marker | null>(null);

  // Throttling timer ref for 1 update/sec requirement
  const lastMapUpdateRef = useRef<number>(0);
  const throttleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('standard');
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);

  const {
    vehicle,
    pedestrian,
    conflictAssessment,
    crosswalks,
    hazardZones,
    scenario,
    mapLayers,
    isLiveGpsActive,
    liveGpsState,
    nearbyRoadInfo,
    recenterMapSignal,
    trafficSegments,
    trafficPreset,
    setTrafficPreset,
    isCollisionOccurred,
    collisionLocation,
    clearCollision,
    isUnder50mProximity,
    distanceVehToPedMeters,
    playProximityAnnouncement,
    activeCrossingRequest,
  } = useSafety();

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter = isLiveGpsActive && liveGpsState.coords
      ? [liveGpsState.coords.lat, liveGpsState.coords.lng]
      : [MAP_CENTER.lat, MAP_CENTER.lng];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter as [number, number],
      zoom: 17,
      zoomControl: true,
      attributionControl: true,
    });

    const standardLayer = L.tileLayer(TILE_LAYERS.standard.url, TILE_LAYERS.standard.options).addTo(map);
    activeTileLayerRef.current = standardLayer;

    // Road Traffic Status layer group (Red for congested, Yellow for manageable, Green for no traffic)
    const trafficGroup = L.layerGroup().addTo(map);
    trafficLayerGroupRef.current = trafficGroup;

    // Hazard layer group
    const hazardGroup = L.layerGroup().addTo(map);
    hazardLayerGroupRef.current = hazardGroup;

    // Crosswalk layer group
    const crosswalkGroup = L.layerGroup().addTo(map);
    crosswalkLayerGroupRef.current = crosswalkGroup;

    // Static Crosswalk markers
    crosswalks.forEach((cw) => {
      const marker = L.marker([cw.position.lat, cw.position.lng], {
        icon: createCrosswalkIcon(cw.isWheelchairAccessible, cw.type),
      });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
          <strong style="display: block; margin-bottom: 4px; color: #0f172a;">${cw.name}</strong>
          <div>Type: ${cw.type.replace('_', ' ')}</div>
          <div>ADA Accessible: ${cw.isWheelchairAccessible ? 'Yes (Curb Cut Ramps)' : 'No'}</div>
          <div>Tactile Paving: ${cw.hasTactilePaving ? 'Present' : 'None'}</div>
          <div>Audible Signal: ${cw.hasAudibleSignal ? 'Active' : 'Silent'}</div>
        </div>
      `);
      crosswalkGroup.addLayer(marker);
    });

    // Nagpur Key Landmarks Layer Group
    const landmarkGroup = L.layerGroup().addTo(map);
    NAGPUR_LANDMARKS.forEach((lm) => {
      const marker = L.marker([lm.position.lat, lm.position.lng], {
        icon: createLandmarkIcon(lm.name, lm.category),
        zIndexOffset: 300,
      });
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
          <strong style="color: #0f172a; display: block; margin-bottom: 2px;">${lm.name}</strong>
          <div style="color: #64748b; font-size: 11px;">Nagpur, Maharashtra</div>
          <div style="font-size: 11px; margin-top: 4px; color: #2563eb; font-weight: 600;">Category: ${lm.category.toUpperCase()}</div>
        </div>
      `);
      landmarkGroup.addLayer(marker);
    });

    // Dynamic conflict zone perimeter circle
    const conflictLocusPos = scenario.conflictPoint || { lat: 21.1492, lng: 79.0884 };
    const conflictCircle = L.circle([conflictLocusPos.lat, conflictLocusPos.lng], {
      radius: 20,
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.12,
      weight: 2,
      dashArray: '4, 4',
    }).addTo(map);
    conflictCircle.bindTooltip('<strong>Dynamic Conflict Zone</strong><br/>Predicted roadway intersection area (Manas Square)');
    dynamicConflictZoneRef.current = conflictCircle;

    // Initial vehicle marker
    const vMarker = L.marker([vehicle.position.lat, vehicle.position.lng], {
      icon: createVehicleIcon(vehicle.headingDeg, vehicle.isBraking, conflictAssessment.riskLevel, vehicle.speedKmh),
    }).addTo(map);
    vehicleMarkerRef.current = vMarker;

    // Initial pedestrian marker
    const pMarker = L.marker([pedestrian.position.lat, pedestrian.position.lng], {
      icon: createPedestrianIcon(pedestrian.mobilityProfile, conflictAssessment.riskLevel, pedestrian.headingDeg),
    }).addTo(map);
    if (onSelectPedestrian) {
      pMarker.on('click', () => onSelectPedestrian());
    }
    pedestrianMarkerRef.current = pMarker;

    // Initial conflict point marker
    if (scenario.conflictPoint) {
      const cMarker = L.marker([scenario.conflictPoint.lat, scenario.conflictPoint.lng], {
        icon: createConflictPointIcon(conflictAssessment.riskLevel),
      }).addTo(map);
      cMarker.bindPopup(`
        <div style="font-size: 13px;">
          <strong>Predicted Conflict Area</strong>
          <div>Target Crossing: Manas Square & Tekdi Road Corridor, Nagpur</div>
        </div>
      `);
      conflictMarkerRef.current = cMarker;
    }

    // Vehicle planned route line
    const vRoute = L.polyline(
      scenario.vehiclePath.map((p) => L.latLng(p.lat, p.lng)),
      { color: '#3b82f6', weight: 4, dashArray: '6, 8', opacity: 0.8 }
    ).addTo(map);
    routePolylineRef.current = vRoute;

    // Live road corridor polyline (from Overpass)
    const liveCorridor = L.polyline([], {
      color: '#0284c7',
      weight: 5,
      opacity: 0.85,
      dashArray: '4, 6',
    }).addTo(map);
    liveRoadCorridorRef.current = liveCorridor;

    // GPS accuracy circle
    const accCircle = L.circle([pedestrian.position.lat, pedestrian.position.lng], {
      radius: 0,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      weight: 1.5,
      dashArray: '2, 4',
    }).addTo(map);
    accuracyCircleRef.current = accCircle;

    // 50-position trail polyline
    const trailLine = L.polyline([], {
      color: '#10b981',
      weight: 3,
      opacity: 0.65,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    trailPolylineRef.current = trailLine;

    mapInstanceRef.current = map;

    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Layer Switcher handler
  const handleSwitchLayer = (layerType: MapLayerType) => {
    setActiveLayer(layerType);
    setShowLayerMenu(false);
    if (!mapInstanceRef.current) return;

    if (activeTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(activeTileLayerRef.current);
    }

    const cfg = TILE_LAYERS[layerType];
    const newLayer = L.tileLayer(cfg.url, cfg.options).addTo(mapInstanceRef.current);
    newLayer.bringToBack();
    activeTileLayerRef.current = newLayer;
  };

  // Recenter on Pedestrian / User function
  const recenterOnPedestrian = () => {
    if (!mapInstanceRef.current) return;
    const target = isLiveGpsActive && liveGpsState.coords ? liveGpsState.coords : pedestrian.position;
    mapInstanceRef.current.setView([target.lat, target.lng], 18, { animate: true });
  };

  // React to external recenter signal
  useEffect(() => {
    if (recenterMapSignal > 0) {
      recenterOnPedestrian();
    }
  }, [recenterMapSignal]);

  // Sync crosswalk layer visibility
  useEffect(() => {
    if (!crosswalkLayerGroupRef.current) return;
    if (mapLayers.crosswalks) {
      crosswalkLayerGroupRef.current.addTo(mapInstanceRef.current!);
    } else {
      crosswalkLayerGroupRef.current.remove();
    }
  }, [mapLayers.crosswalks]);

  // Sync hazard zones layer
  useEffect(() => {
    if (!hazardLayerGroupRef.current) return;
    hazardLayerGroupRef.current.clearLayers();

    if (showConflictZones && mapLayers.hazardZones) {
      hazardZones.forEach((hz) => {
        const color = hz.riskRating === 'high' ? '#ef4444' : '#f59e0b';
        const circle = L.circle([hz.center.lat, hz.center.lng], {
          radius: hz.radiusMeters,
          color: color,
          fillColor: color,
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: '4, 4',
        });
        circle.bindTooltip(`<strong>${hz.name}</strong><br/>${hz.description}`);
        hazardLayerGroupRef.current?.addLayer(circle);
      });
    }
  }, [showConflictZones, mapLayers.hazardZones, hazardZones]);

  // Sync Road Traffic Status polylines (Red = Congested, Yellow = Manageable, Green = No Traffic)
  useEffect(() => {
    if (!trafficLayerGroupRef.current) return;
    trafficLayerGroupRef.current.clearLayers();

    if (mapLayers.trafficStatus) {
      trafficSegments.forEach((seg) => {
        const color =
          seg.level === 'congested'
            ? '#ef4444' // RED: Congested
            : seg.level === 'manageable'
            ? '#f59e0b' // YELLOW: Manageable
            : '#10b981'; // GREEN: No Traffic

        const poly = L.polyline(
          seg.path.map((p) => L.latLng(p.lat, p.lng)),
          {
            color: color,
            weight: 7,
            opacity: 0.82,
            lineCap: 'round',
            lineJoin: 'round',
          }
        );

        poly.bindTooltip(
          `<div style="font-family: inherit; font-size: 12px; line-height: 1.45; padding: 2px;">
            <strong style="color: #0f172a; font-size: 13px;">${seg.name}</strong><br/>
            Traffic Flow: <span style="font-weight: 800; color: ${color};">${
              seg.level === 'congested'
                ? '🔴 RED — CONGESTED'
                : seg.level === 'manageable'
                ? '🟡 YELLOW — MANAGEABLE'
                : '🟢 GREEN — NO TRAFFIC'
            }</span><br/>
            Speed: ${seg.speedKmh} km/h • ${seg.description}
          </div>`,
          { sticky: true }
        );

        trafficLayerGroupRef.current?.addLayer(poly);
      });
    }
  }, [trafficSegments, mapLayers.trafficStatus]);

  // Show Collision on Road in Map
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (isCollisionOccurred && collisionLocation) {
      if (!collisionMarkerRef.current) {
        const cMarker = L.marker([collisionLocation.lat, collisionLocation.lng], {
          icon: createCollisionMarkerIcon(),
          zIndexOffset: 1500,
        }).addTo(mapInstanceRef.current);

        cMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 13px; line-height: 1.45;">
            <strong style="display: block; color: #dc2626; font-size: 14px; font-weight: 800;">💥 ROADWAY COLLISION DETECTED</strong>
            <div style="margin-top: 4px;"><strong>Location:</strong> Tekdi Road Corridor, Nagpur</div>
            <div><strong>Pedestrian Status:</strong> Halted on Roadway</div>
            <div><strong>Vehicle Status:</strong> Emergency Stop (0 km/h)</div>
            <div style="color: #64748b; font-size: 11px; margin-top: 4px; border-top: 1px solid #e2e8f0; padding-top: 3px;">
              Automated accident emergency signal dispatched.
            </div>
          </div>
        `).openPopup();

        collisionMarkerRef.current = cMarker;
      } else {
        collisionMarkerRef.current.setLatLng([collisionLocation.lat, collisionLocation.lng]);
        collisionMarkerRef.current.setOpacity(1);
        collisionMarkerRef.current.openPopup();
      }
    } else {
      if (collisionMarkerRef.current) {
        collisionMarkerRef.current.setOpacity(0);
        collisionMarkerRef.current.closePopup();
      }
    }
  }, [isCollisionOccurred, collisionLocation]);

  // Smooth pan on scenario change
  useEffect(() => {
    if (!mapInstanceRef.current || !scenario) return;
    const center = scenario.conflictPoint || MAP_CENTER;
    mapInstanceRef.current.panTo([center.lat, center.lng], { animate: true });
  }, [scenario.id]);

  // Show Pedestrian Crossing Request Beacon on Map
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (
      activeCrossingRequest &&
      activeCrossingRequest.status !== 'completed' &&
      activeCrossingRequest.status !== 'cancelled' &&
      activeCrossingRequest.crossingPosition
    ) {
      const pos = activeCrossingRequest.crossingPosition;
      if (!crossingBeaconMarkerRef.current) {
        const marker = L.marker([pos.lat, pos.lng], {
          icon: createCrossingBeaconIcon(activeCrossingRequest.status),
          zIndexOffset: 1200,
        }).addTo(mapInstanceRef.current);

        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.45;">
            <strong style="color: #2563eb; font-size: 13px; font-weight: 800;">🚶 PEDESTRIAN CROSSING REQUEST</strong>
            <div style="margin-top: 3px;"><strong>Location:</strong> ${activeCrossingRequest.crossingLocationName || 'Zebra Crossing'}</div>
            <div><strong>Status:</strong> ${activeCrossingRequest.status.replace('_', ' ').toUpperCase()}</div>
            <div><strong>Approaching Vehicle:</strong> ${activeCrossingRequest.currentDistanceMeters ?? ''}m away (${vehicle.speedKmh} km/h)</div>
            <div style="color: #64748b; font-size: 11px; margin-top: 3px; border-top: 1px solid #e2e8f0; padding-top: 2px;">
              Request ID: ${activeCrossingRequest.id}
            </div>
          </div>
        `);

        crossingBeaconMarkerRef.current = marker;
      } else {
        crossingBeaconMarkerRef.current.setLatLng([pos.lat, pos.lng]);
        crossingBeaconMarkerRef.current.setIcon(createCrossingBeaconIcon(activeCrossingRequest.status));
        crossingBeaconMarkerRef.current.setOpacity(1);
      }
    } else {
      if (crossingBeaconMarkerRef.current) {
        crossingBeaconMarkerRef.current.setOpacity(0);
        crossingBeaconMarkerRef.current.closePopup();
      }
    }
  }, [activeCrossingRequest, vehicle.speedKmh]);

  // Throttled Map Redraw (max 1 update per second)
  useEffect(() => {
    const applyUpdates = () => {
      lastMapUpdateRef.current = Date.now();

      // 1. Vehicle Marker with speed tag and heading
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.setLatLng([vehicle.position.lat, vehicle.position.lng]);
        vehicleMarkerRef.current.setIcon(
          createVehicleIcon(vehicle.headingDeg, vehicle.isBraking, conflictAssessment.riskLevel, vehicle.speedKmh)
        );
      }

      // 2. Pedestrian Marker with Heading
      if (pedestrianMarkerRef.current) {
        pedestrianMarkerRef.current.setLatLng([pedestrian.position.lat, pedestrian.position.lng]);
        pedestrianMarkerRef.current.setIcon(
          createPedestrianIcon(pedestrian.mobilityProfile, conflictAssessment.riskLevel, pedestrian.headingDeg)
        );
      }

      // 3. Dynamic Conflict Zone & Conflict Marker
      const conflictLoc = conflictAssessment.conflictPoint || scenario.conflictPoint;
      if (conflictLoc) {
        if (conflictMarkerRef.current) {
          conflictMarkerRef.current.setLatLng([conflictLoc.lat, conflictLoc.lng]);
          conflictMarkerRef.current.setIcon(createConflictPointIcon(conflictAssessment.riskLevel));
          if (!mapLayers.conflictZones) {
            conflictMarkerRef.current.setOpacity(0);
          } else {
            conflictMarkerRef.current.setOpacity(1);
          }
        }

        // Update Dynamic Risk Zone Perimeter circle
        if (dynamicConflictZoneRef.current) {
          if (mapLayers.conflictZones) {
            dynamicConflictZoneRef.current.setLatLng([conflictLoc.lat, conflictLoc.lng]);
            const riskColor =
              conflictAssessment.riskLevel === 'red'
                ? '#ef4444'
                : conflictAssessment.riskLevel === 'yellow'
                ? '#f59e0b'
                : '#10b981';

            const radius =
              conflictAssessment.riskLevel === 'red'
                ? 32
                : conflictAssessment.riskLevel === 'yellow'
                ? 22
                : 14;

            dynamicConflictZoneRef.current.setRadius(radius);
            dynamicConflictZoneRef.current.setStyle({
              color: riskColor,
              fillColor: riskColor,
              fillOpacity: conflictAssessment.riskLevel === 'red' ? 0.22 : 0.12,
              weight: conflictAssessment.riskLevel === 'red' ? 2.5 : 1.5,
              opacity: 0.9,
            });
            dynamicConflictZoneRef.current.setTooltipContent(
              `<strong>Dynamic Conflict Locus: ${conflictAssessment.riskLevel.toUpperCase()} RISK</strong><br/>Status: ${conflictAssessment.conflictStatus.replace('_', ' ')} (${conflictAssessment.distanceMeters}m from vehicle)`
            );
          } else {
            dynamicConflictZoneRef.current.setRadius(0);
          }
        }
      }

      // 4. Accuracy Circle
      if (accuracyCircleRef.current) {
        if (isLiveGpsActive && liveGpsState.coords && liveGpsState.accuracyMeters) {
          accuracyCircleRef.current.setLatLng([liveGpsState.coords.lat, liveGpsState.coords.lng]);
          accuracyCircleRef.current.setRadius(liveGpsState.accuracyMeters);
          accuracyCircleRef.current.setStyle({ opacity: 0.8, fillOpacity: 0.12 });
        } else {
          accuracyCircleRef.current.setRadius(0);
        }
      }

      // 5. Position Trail (up to 50 points)
      if (trailPolylineRef.current) {
        if (mapLayers.gpsTrail && isLiveGpsActive && liveGpsState.trail && liveGpsState.trail.length > 1) {
          trailPolylineRef.current.setLatLngs(
            liveGpsState.trail.map((p) => L.latLng(p.lat, p.lng))
          );
        } else {
          trailPolylineRef.current.setLatLngs([]);
        }
      }

      // 6. Overpass Road Corridor & Vehicle Corridor
      if (liveRoadCorridorRef.current) {
        if (mapLayers.vehicleCorridor && isLiveGpsActive && nearbyRoadInfo.nearestRoadCoordinates.length >= 2) {
          liveRoadCorridorRef.current.setLatLngs(
            nearbyRoadInfo.nearestRoadCoordinates.map((p) => L.latLng(p.lat, p.lng))
          );
        } else {
          liveRoadCorridorRef.current.setLatLngs([]);
        }
      }

      // 7. Vehicle planned route polyline
      if (routePolylineRef.current) {
        if (mapLayers.vehicleCorridor && !isLiveGpsActive) {
          routePolylineRef.current.setLatLngs(
            scenario.vehiclePath.map((p) => L.latLng(p.lat, p.lng))
          );
        } else {
          routePolylineRef.current.setLatLngs([]);
        }
      }

      // 8. Auto-pan when live GPS is active
      if (isLiveGpsActive && liveGpsState.coords && mapInstanceRef.current) {
        mapInstanceRef.current.panTo([liveGpsState.coords.lat, liveGpsState.coords.lng], {
          animate: true,
          duration: 0.5,
        });
      }
    };

    const now = Date.now();
    const elapsed = now - lastMapUpdateRef.current;

    if (elapsed >= 1000) {
      applyUpdates();
    } else {
      if (throttleTimeoutRef.current) clearTimeout(throttleTimeoutRef.current);
      throttleTimeoutRef.current = setTimeout(applyUpdates, 1000 - elapsed);
    }

    return () => {
      if (throttleTimeoutRef.current) clearTimeout(throttleTimeoutRef.current);
    };
  }, [
    vehicle.position,
    vehicle.isBraking,
    vehicle.headingDeg,
    vehicle.speedKmh,
    pedestrian.position,
    pedestrian.mobilityProfile,
    pedestrian.headingDeg,
    conflictAssessment.riskLevel,
    conflictAssessment.conflictPoint,
    conflictAssessment.conflictStatus,
    conflictAssessment.distanceMeters,
    mapLayers,
    isLiveGpsActive,
    liveGpsState.coords,
    liveGpsState.accuracyMeters,
    liveGpsState.trail,
    nearbyRoadInfo.nearestRoadCoordinates,
    scenario,
  ]);

  return (
    <div className={`relative w-full ${interactiveHeight} rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* TOP CONTROLS: Layer Switcher & Recenter on Me */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-2">
        {/* Recenter on me */}
        <button
          onClick={recenterOnPedestrian}
          title="Recenter map on your position"
          className="p-2 bg-white/95 backdrop-blur-md rounded-lg shadow-md border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center cursor-pointer"
        >
          <Crosshair className="w-4 h-4 text-blue-600" />
        </button>

        {/* Map Layers Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            title="Change Map Tile Layer"
            className="flex items-center gap-1.5 px-2.5 py-2 bg-white/95 backdrop-blur-md rounded-lg shadow-md border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-slate-700" />
            <span className="hidden sm:inline capitalize">{activeLayer}</span>
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 text-xs space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Map Tile Provider
              </div>
              {(Object.keys(TILE_LAYERS) as MapLayerType[]).map((key) => (
                <button
                  key={key}
                  onClick={() => handleSwitchLayer(key)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    activeLayer === key
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {TILE_LAYERS[key].name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TOP STATUS BADGE: GPS Mode status */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1.5 pointer-events-none">
        {isLiveGpsActive ? (
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg shadow-md text-xs font-medium border border-slate-700/60 flex items-center gap-2 pointer-events-auto">
            {liveGpsState.status === 'acquiring' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Acquiring GPS fix...</span>
              </>
            ) : liveGpsState.status === 'lost' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-amber-200 font-semibold">GPS signal lost (&gt;10s)</span>
              </>
            ) : liveGpsState.status === 'error' ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-200 font-semibold">GPS Error</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-semibold text-emerald-400">Live GPS Connected</span>
                {liveGpsState.accuracyMeters && (
                  <span className="text-[11px] text-slate-300 font-mono">
                    (±{Math.round(liveGpsState.accuracyMeters)}m)
                  </span>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg shadow-sm text-[11px] font-medium border border-slate-700/50 flex items-center gap-1.5 pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Simulated Spatial Corridor</span>
          </div>
        )}
      </div>

      {/* TOP CENTER: ROAD TRAFFIC STATUS SELECTOR */}
      {mapLayers.trafficStatus && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200 hidden md:flex items-center gap-2 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Car className="w-3.5 h-3.5 text-slate-700" />
            Road Traffic:
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setTrafficPreset('congested')}
              title="Set traffic: Red (Congested)"
              className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                trafficPreset === 'congested'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔴 Congested
            </button>
            <button
              onClick={() => setTrafficPreset('moderate')}
              title="Set traffic: Yellow (Manageable)"
              className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                trafficPreset === 'moderate'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🟡 Manageable
            </button>
            <button
              onClick={() => setTrafficPreset('light')}
              title="Set traffic: Green (No Traffic)"
              className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                trafficPreset === 'light'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🟢 No Traffic
            </button>
          </div>
        </div>
      )}

      {/* FLOATING COLLISION ALERT BANNER ON ROAD */}
      {isCollisionOccurred && (
        <div className="absolute top-12 left-3 z-[400] bg-rose-600 text-white px-3.5 py-2.5 rounded-xl shadow-2xl border-2 border-white flex items-center gap-3 text-xs animate-bounce">
          <span className="text-xl">💥</span>
          <div>
            <div className="font-black uppercase tracking-wider text-xs">Roadway Collision Occurred</div>
            <div className="text-[11px] text-rose-100 font-medium">Pedestrian has halted. Vehicle stopped at collision point.</div>
          </div>
          <button
            onClick={clearCollision}
            className="ml-2 px-2.5 py-1 bg-white text-rose-700 font-bold text-[11px] rounded-lg shadow-sm hover:bg-rose-50 cursor-pointer"
          >
            Clear Collision
          </button>
        </div>
      )}

      {/* FLOATING 50-METER PROXIMITY WARNING BANNER */}
      {isUnder50mProximity && !isCollisionOccurred && (
        <div className="absolute top-12 left-3 z-[400] bg-amber-500 text-slate-950 font-bold px-3.5 py-2 rounded-xl shadow-xl border border-amber-300 flex items-center gap-2.5 text-xs">
          <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
          <div>
            <span className="font-extrabold uppercase tracking-wide">⚠️ Warning Announcement: </span>
            <span className="font-mono">Under 50m ({Math.round(distanceVehToPedMeters)}m)</span>
          </div>
          <button
            onClick={playProximityAnnouncement}
            title="Replay Spoken Warning"
            className="ml-1 px-2 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Volume2 className="w-3 h-3" />
            Replay Voice
          </button>
        </div>
      )}

      {/* FLOATING ACTIVE CROSSING REQUEST PILL */}
      {activeCrossingRequest && activeCrossingRequest.status !== 'completed' && activeCrossingRequest.status !== 'cancelled' && (
        <div className="absolute top-12 right-3 z-[400] bg-blue-600 text-white font-bold px-3 py-1.5 rounded-xl shadow-lg border border-blue-400 flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>Crossing Request: {activeCrossingRequest.status.replace('_', ' ').toUpperCase()}</span>
          <span className="bg-blue-800 text-blue-100 font-mono text-[10px] px-1.5 py-0.5 rounded">
            {activeCrossingRequest.currentDistanceMeters ?? Math.round(distanceVehToPedMeters)}m
          </span>
        </div>
      )}

      {/* COMPREHENSIVE FLOATING MAP LEGEND */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 shadow-sm flex flex-wrap items-center gap-3 max-w-[calc(100%-24px)]">
        {/* Dynamic Risk Levels */}
        <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Risk:</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Low
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Moderate
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> High
          </span>
        </div>

        {/* Road Traffic Status (Red for congested, Yellow for manageable, Green for no traffic) */}
        {mapLayers.trafficStatus && (
          <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Traffic:</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
              <span className="w-3 h-1.5 rounded-sm bg-rose-500 inline-block" /> Red: Congested
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
              <span className="w-3 h-1.5 rounded-sm bg-amber-500 inline-block" /> Yellow: Manageable
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <span className="w-3 h-1.5 rounded-sm bg-emerald-500 inline-block" /> Green: No Traffic
            </span>
          </div>
        )}

        {/* Corridors & Points */}
        <div className="flex items-center gap-1.5 font-medium text-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
          <span>Vehicle Corridor</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span>Pedestrian Path</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          <span>Conflict Locus</span>
        </div>
        {mapLayers.crosswalks && (
          <div className="flex items-center gap-1 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 border border-blue-500 bg-white rounded-xs inline-block" />
            <span>Zebra Crosswalk</span>
          </div>
        )}
      </div>
    </div>
  );
};
