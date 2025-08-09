import { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ReactPhotoSphereViewer, type ViewerAPI } from 'react-photo-sphere-viewer';
import { EquirectangularAdapter } from '@photo-sphere-viewer/core';
import Papa from 'papaparse';
import MiniMap from './MiniMap';
import Compass from './Compass';
import './App.css';
import { normalizeHeading } from './utils/normalizeHeading';

interface PanoRec {
  id: number;
  link: string;
  lat: number;
  lon: number;
  northing: number;
}

export default function App() {
  const [list, setList] = useState<PanoRec[]>([]);
  const [idx,  setIdx]  = useState(0);
  const [heading, setHeading] = useState(0);

  const viewerRef = useRef<ViewerAPI | null>(null);

  /* ① load catalogue */
  useEffect(() => {
    Papa.parse('/panoramas.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: ({ data, errors }: { data: any[]; errors: any[] }) => {
        if (errors.length > 0) {
          console.error('CSV parsing errors:', errors);
        }
        setList(data as PanoRec[]);
      },
      error: (error: any) => {
        console.error('CSV loading error:', error);
      }
    });
  }, []);

  /* ② setup callbacks once the viewer is ready */
  const onReady = () => {
    const v = viewerRef.current!;
    /* rotate north-offset so the first view looks "forward" */
    v.rotate({ yaw: `${list[idx].northing}deg`, pitch: v.getPosition().pitch });
  };

  /* Track rotation changes */
  useEffect(() => {
    if (!viewerRef.current || !list[idx]) return;
    
    const interval = setInterval(() => {
      if (viewerRef.current) {
        const position = viewerRef.current.getPosition();
        // Convert yaw to heading (yaw is in radians, convert to degrees)
        // Add the northing offset to sync with the initial rotation
        const rawHeading = (position.yaw * 180 / Math.PI) + list[idx].northing;
        const newHeading = normalizeHeading(rawHeading);
        setHeading(newHeading);
      }
    }, 100); // Update every 100ms
    
    return () => clearInterval(interval);
  }, [idx, list]);

  if (!list.length) return <p>Loading catalogue…</p>;
  const pano = list[idx];

  // Validate that lat and lon are valid numbers
  if (isNaN(pano.lat) || isNaN(pano.lon)) {
    return <p>Error: Invalid coordinates for panorama {pano.id}</p>;
  }

  return (
    <div className="container">
      {/* left: 360 viewer */}
      <div style={{ position: 'relative' }}>
        <ReactPhotoSphereViewer
          src={pano.link}
          height="100vh"
          width="calc(100vw - 320px)"
          ref={viewerRef}
          adapter={[EquirectangularAdapter, { useXmpData: false }]}
          onReady={onReady}
          moveSpeed={5}
          defaultZoomLvl={0}
          navbar={['zoom', 'fullscreen']}
        />
        <Compass heading={heading} />
      </div>

      {/* right: minimap */}
      <aside className="sidebar">
        <div style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          marginBottom: '16px', 
          textAlign: 'center',
          color: '#333'
        }}>
          Sager <span style={{ textDecoration: 'line-through' }}>Ops</span> Oops :P
        </div>
        <div style={{ padding: '10px', marginBottom: '10px', fontSize: '12px', color: '#666' }}>
          Coordinates: {pano.lat.toFixed(6)}, {pano.lon.toFixed(6)}
        </div>
        <MiniMap lat={pano.lat} lon={pano.lon} heading={heading} />
        <select
          value={idx}
          onChange={e => { setIdx(+e.target.value); setHeading(0); }}
        >
          {list.map((p, i) => (
            <option key={p.id} value={i}>{`View ${p.id}`}</option>
          ))}
        </select>
        <div style={{ marginTop: 8 }}>Heading {heading.toFixed(0)}°</div>
      </aside>
    </div>
  );
}
