/// <reference types="react" />

import { DetailedHTMLProps, HTMLAttributes } from 'react';

declare global {
    interface Window {
        AFRAME: {
            registerComponent: (name: string, component: any) => void;
            components: {
                [key: string]: any;
            };
        };
    }

    namespace JSX {
        interface IntrinsicElements {
            'a-scene': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
                embedded?: boolean;
                arjs?: string;
                'ar-scene-loaded'?: boolean;
                'vr-mode-ui'?: string;
                renderer?: string;
                'loading-screen'?: string;
            };
            'a-entity': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
                position?: string;
                rotation?: string;
                scale?: string;
                'gltf-model'?: string;
                animation?: string;
                camera?: boolean;
            };
            'a-box': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
                position?: string;
                rotation?: string;
                width?: string;
                height?: string;
                depth?: string;
                material?: string;
                animation?: string;
                class?: string;
                'data-treasure-index'?: string;
            };
            'a-sphere': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
                position?: string;
                radius?: string;
                material?: string;
            };
            'a-assets': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
            'a-asset-item': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
                id: string;
                src: string;
            };
            'a-marker': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
                preset?: string;
                type?: string;
            };
            'a-camera': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
        }
    }
}

// GLTFモデルのインポート用の型定義
declare module "*.gltf" {
    const content: string;
    export default content;
}

// A-Frame関連の型定義
declare namespace AFRAME {
    interface System {
        init(): void;
    }
}

declare module 'aframe' {
    const AFRAME: any;
    export default AFRAME;
}

declare module 'aframe-ar' {
    const AFRAMEAR: any;
    export default AFRAMEAR;
}

export { }; 