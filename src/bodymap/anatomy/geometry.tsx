// Hand-authored anatomy for the body map, anterior and posterior. viewBox 0 0 160 360, midline x = 80.
// Silhouette proportions (~7.5 heads) and the half-outline path are copied from Ben's
// src/components/BodyMap.tsx so both maps read as the same figure.
//
// Class names used by BodyFigure.module.css:
//   shape  = organ / muscle with a soft fill and a status outline
//   line   = bone or vessel drawn as a stroke
//   detail = inner texture (gyri, gut coils), never status coloured
//   hit    = invisible, enlarged click target
// Draw order = array order (first is at the back).

import type { ReactNode } from "react";
import type { RegionId, View } from "../regions.ts";

export const VIEWBOX = "0 0 160 360";

// Copied from src/components/BodyMap.tsx (HALF, MIRROR)
export const HALF =
  "M80 54 L88 55 L89 64 C97 67 111 68 119 71 C127 74 131 80 131 90 C132 104 133 118 134 132 C135 146 137 162 138 176 C139 188 140 200 140 208 C143 213 145 222 142 231 C140 237 134 237 133 231 C132 224 131 216 131 209 C129 196 126 182 124 168 C122 154 120 140 118 128 C117 118 116 110 114 104 C113 126 110 148 108 166 C107 176 111 186 113 196 C114 210 112 236 110 256 C109 266 108 272 107 280 C109 296 109 314 104 334 C104 340 108 346 106 350 L88 350 C87 344 88 338 88 334 C86 316 85 298 86 282 C86 276 87 270 87 264 C86 246 84 226 82 212 L80 210 Z";
export const MIRROR = "translate(160 0) scale(-1 1)";
export const HEAD = { cx: 80, cy: 32, rx: 16, ry: 21 };

/** Draw an element and its mirror image across the midline. */
const both = (el: ReactNode) => (
  <>
    {el}
    <g transform={MIRROR}>{el}</g>
  </>
);

export type RegionArt = {
  id: RegionId;
  art: ReactNode;
  hit: ReactNode;
  badge: [number, number];
};

// ---------- shared pieces ----------

const BRAIN = "M67.5 27 C66.5 18.5 72 13.5 80 13.5 C88 13.5 93.5 18.5 92.5 27 C92.3 31.5 89 34.5 85 34.5 C82.5 35.3 77.5 35.3 75 34.5 C71 34.5 67.7 31.5 67.5 27 Z";
const GYRI = "M70.5 21 C73 19 75 23 77.5 21 M82.5 21 C85 23 87 19 89.5 21 M70 27 C72.5 25 75 29 77.5 27 M82.5 27 C85 29 87.5 25 90 27 M73 16.5 C75 18 77 15.5 78.5 17 M81.5 17 C83 15.5 85 18 87 16.5";

const brainHit = <ellipse cx="80" cy="25" rx="15" ry="13" />;

const skinArt = (
  <>
    <path d={HALF} className="line skinLine" />
    <path d={HALF} transform={MIRROR} className="line skinLine" />
    <ellipse {...HEAD} className="line skinLine" />
  </>
);
const skinHit = (
  <>
    <path d={HALF} className="hitStroke" />
    <path d={HALF} transform={MIRROR} className="hitStroke" />
    <ellipse {...HEAD} className="hitStroke" />
  </>
);

// The HALO ring: a tilted orbit crossing the waist. Back half sits behind the figure, front half in front.
const RING = { cx: 80, cy: 192, rx: 77, ry: 12 };
export const RING_BACK = `M${RING.cx - RING.rx} ${RING.cy} A${RING.rx} ${RING.ry} 0 0 1 ${RING.cx + RING.rx} ${RING.cy}`;
export const RING_FRONT = `M${RING.cx + RING.rx} ${RING.cy} A${RING.rx} ${RING.ry} 0 0 1 ${RING.cx - RING.rx} ${RING.cy}`;
// Only the ring's ends outside the silhouette are clickable, so it never steals clicks from organs.
const wholeHit = both(<path d="M118.5 181.6 L146.7 186 L157 192 L146.7 198 L118.5 202.4" className="hitStroke wide" />);

const LIMB_BONES = both(
  <>
    <path d="M96 210 C97 232 97.5 254 98 274" className="line bone long" />
    <ellipse cx="98" cy="279" rx="3.2" ry="3" className="shape boneJoint" />
    <path d="M98 285 C97.8 302 97.5 318 97 334" className="line bone long" />
    <path d="M101 287 C101 304 100.5 318 100 332" className="line bone thin" />
    <path d="M122 80 C124 106 126 134 128 160" className="line bone long" />
    <path d="M128 166 C130 180 132 194 134 206" className="line bone thin" />
    <path d="M131 166 C133 180 135 194 137 206" className="line bone thin" />
  </>,
);
const PELVIS = both(<path d="M80 190 C72 184 61 186 58 195 C56 203 62 210 71 210 C75 209 78 207 80 207" className="line bone" />);
const limbBoneHits = both(
  <>
    <path d="M96 210 C97 232 97.5 254 98 274 L97 334" className="hitStroke wide" />
    <path d="M122 80 C124 106 126 134 128 160 L136 206" className="hitStroke wide" />
  </>,
);
const pelvisHit = both(<path d="M80 190 C72 184 61 186 58 195 C56 203 62 210 71 210 C75 209 78 207 80 207" className="hitStroke wide" />);

// ---------- ANTERIOR ----------

export const ANTERIOR: RegionArt[] = [
  {
    id: "skin_immune",
    art: (
      <>
        {skinArt}
        {/* lymph nodes: cervical, axillary, inguinal */}
        {both(
          <>
            <circle cx="88.5" cy="58" r="1.7" className="shape node" />
            <circle cx="109" cy="96" r="2" className="shape node" />
            <circle cx="91" cy="206" r="2" className="shape node" />
          </>,
        )}
      </>
    ),
    hit: (
      <>
        {skinHit}
        {both(
          <>
            <circle cx="88.5" cy="58" r="5" />
            <circle cx="109" cy="96" r="6" />
            <circle cx="91" cy="206" r="6" />
          </>,
        )}
      </>
    ),
    badge: [33, 96],
  },
  {
    id: "muscles",
    art: both(
      <>
        <path d="M117 73 C126 74 131 82 131 92 C131 100 127 104 123 104 C120 96 117 86 114 80 Z" className="shape muscle" />
        <path d="M89 216 C96 210 106 214 108 226 C110 242 107 258 102 266 C97 268 92 262 90 252 C88 240 87 226 89 216 Z" className="shape muscle" />
        <path d="M101 290 C104 296 104 312 102 326 C100 328 99 326 99 320 C99 308 99 298 101 290 Z" className="shape muscle" />
      </>,
    ),
    hit: both(
      <>
        <ellipse cx="123" cy="89" rx="9" ry="13" />
        <ellipse cx="98.5" cy="240" rx="12" ry="29" />
        <ellipse cx="101" cy="308" rx="6" ry="20" />
      </>,
    ),
    badge: [118, 238],
  },
  {
    id: "skeleton",
    art: (
      <>
        {both(<path d="M81 71 C91 68.5 104 70 115 74" className="line bone" />)}
        <path d="M80 77 L80 116" className="line bone long" />
        {both(
          <>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <path key={i} d={`M81.5 ${82 + i * 8} C93 ${80 + i * 8} 103 ${84 + i * 8} 106 ${94 + i * 8}`} className="line bone rib" />
            ))}
          </>,
        )}
        {PELVIS}
        {LIMB_BONES}
      </>
    ),
    hit: (
      <>
        {both(<path d="M81 71 C91 68.5 104 70 115 74" className="hitStroke wide" />)}
        {pelvisHit}
        {limbBoneHits}
      </>
    ),
    badge: [56, 279],
  },
  {
    id: "vessels",
    art: (
      <>
        {/* aortic arch, descending aorta, iliac and femoral arteries */}
        <path d="M81 104 C80 96 80 90 84 89.5 C88 89 88.5 94 87 100 L84.5 150 L82 193" className="line vessel artery" />
        <path d="M82 193 C86 197 90 203 92 211 C94 230 95 250 96 270" className="line vessel artery" />
        <path d="M82 193 C77 197 72 203 69 211 C67 230 66 250 65 270" className="line vessel artery" />
        {/* carotids */}
        <path d="M82.5 90 C80 80 77.5 66 76.5 46" className="line vessel artery thinV" />
        <path d="M85.5 90 C86 80 85.5 66 85 46" className="line vessel artery thinV" />
        {/* jugular veins */}
        {both(<path d="M89.5 90 C89 80 89.5 64 89 48" className="line vessel vein" />)}
      </>
    ),
    hit: (
      <>
        <path d="M84 89 L76 46 M85.5 90 L85 46" className="hitStroke" />
        {both(<path d="M89.5 90 L89 48" className="hitStroke" />)}
        <path d="M82 193 C86 197 90 203 92 211 L96 270" className="hitStroke" />
        <path d="M82 193 C77 197 72 203 69 211 L65 270" className="hitStroke" />
      </>
    ),
    badge: [66, 64],
  },
  {
    id: "kidneys",
    art: (
      <>
        {/* anatomical right kidney (viewer's left) sits a little lower; seen through the abdomen */}
        <path d="M62 153 C56 153 53.5 160 53.5 166 C53.5 173 56.5 178 62 178 C65 178 66 175 65 172 C64 169 64 163 65 160 C66 157 66 153 62 153 Z" className="shape organ behind" />
        <path d="M98 149 C104 149 106.5 156 106.5 162 C106.5 169 103.5 174 98 174 C95 174 94 171 95 168 C96 165 96 159 95 156 C94 153 94 149 98 149 Z" className="shape organ behind" />
      </>
    ),
    hit: (
      <>
        <ellipse cx="58" cy="165.5" rx="9" ry="15" />
        <ellipse cx="102" cy="161.5" rx="9" ry="15" />
      </>
    ),
    badge: [46, 152],
  },
  {
    id: "lungs",
    art: (
      <>
        <path d="M75 82 C66 84 60 94 58.5 110 C57.5 124 59.5 135 63.5 140 C68.5 142.5 74 139 76 132 C77 118 77 98 75 82 Z" className="shape organ lung" />
        <path d="M85 86 C88 83 93 82 96 84.5 C101.5 89 102.5 103 102.5 115 C102.5 128 100.5 136 96.5 140 C92.5 141 89.5 139 88.5 135 C92 130 93 124 91 119 C89 112 86 104 85 86 Z" className="shape organ lung" />
        <path d="M68 96 C66 104 65 114 66 124 M93 98 C96 106 97 114 97 124" className="detail" />
      </>
    ),
    hit: (
      <>
        <path d="M75 80 C64 82 56 94 56 110 C55 126 58 137 63 142 C70 145 77 138 78 130 Z" />
        <path d="M84 84 C89 80 95 80 98 83 C104 88 105 104 105 116 C105 130 102 138 97 142 C91 143 88 140 87 134 Z" />
      </>
    ),
    badge: [52, 94],
  },
  {
    id: "gut",
    art: (
      <>
        {/* stomach (J-shape, under the left ribs) */}
        <path d="M87 133 C93 127.5 102 131.5 101 141 C100 149.5 94.5 155.5 86.5 155.5 C80.5 155.5 76.5 151.5 78.5 147.5 C82.5 149.5 88 147.5 89 142.5 C89.8 138.8 87.5 136.5 87 133 Z" className="shape organ" />
        {/* large-bowel frame with small-bowel coils inside */}
        <path d="M68 168 C71 163 89 163 92 168 C95 178 95 192 92 199 C86 203 74 203 68 199 C65 192 65 178 68 168 Z" className="shape organ" />
        <path d="M71.5 174 C75 171 78 177 81.5 174 C85 171 88 177 89.5 175 M71 182 C74.5 179 78 185 81.5 182 C85 179 88 185 90 183 M71.5 190 C75 187 78 193 81.5 190 C85 187 88 193 89 191" className="detail" />
      </>
    ),
    hit: (
      <>
        <path d="M86 130 C94 125 104 130 103 141 C102 151 96 158 86 158 C79 158 74 153 77 146 Z" />
        <path d="M67 165 C71 160 89 160 93 165 C97 177 97 193 93 201 C86 205 74 205 67 201 C63 193 63 177 67 165 Z" />
      </>
    ),
    badge: [107, 140],
  },
  {
    id: "heart",
    art: (
      <>
        <path d="M84.5 103 C89.5 100.5 96.5 104.5 96.5 112 C96.5 120.5 89.5 127 84 130 C79.5 126 76 119.5 76.5 112.5 C77 107 80 102.5 84.5 103 Z" className="shape organ heartShape" />
        <path d="M82 106 C84 112 86 118 85 126" className="detail" />
      </>
    ),
    hit: <ellipse cx="86" cy="115.5" rx="13" ry="15" />,
    badge: [101, 105],
  },
  {
    id: "brain",
    art: (
      <>
        <path d={BRAIN} className="shape organ" />
        <path d="M80 14.5 L80 34" className="detail" />
        <path d={GYRI} className="detail" />
      </>
    ),
    hit: brainHit,
    badge: [98, 15],
  },
  {
    id: "eyes",
    art: both(
      <>
        <path d="M86.5 38.5 C88.5 36.3 92 36.3 94 38.5 C92 40.6 88.5 40.6 86.5 38.5 Z" className="shape organ eye" />
        <circle cx="90.2" cy="38.5" r="1.1" className="detail iris" />
      </>,
    ),
    hit: <rect x="63" y="32" width="34" height="13" rx="6" />,
    badge: [101, 38],
  },
  {
    id: "whole_body",
    art: (
      <>
        <path d={RING_FRONT} className="line ring" />
      </>
    ),
    hit: wholeHit,
    badge: [153, 192],
  },
];

// ---------- POSTERIOR ----------
// Seen from behind: the person's left is on the viewer's left.

export const POSTERIOR: RegionArt[] = [
  {
    id: "skin_immune",
    art: skinArt,
    hit: skinHit,
    badge: [33, 96],
  },
  {
    id: "muscles",
    art: both(
      <>
        {/* posterior deltoid, triceps */}
        <path d="M116 73 C125 74 131 82 131 92 C131 99 128 103 124 103 C121 95 118 86 114 80 Z" className="shape muscle" />
        <path d="M123 106 C127 112 129 126 128 146 C126 150 124 148 123.5 142 C122.5 130 122 116 123 106 Z" className="shape muscle" />
        {/* gluteus */}
        <path d="M80.5 194 C90 189 104 192 108.5 203 C111 213 105.5 223 95.5 224.5 C87.5 225 81.5 220 80.5 213 Z" className="shape muscle" />
        {/* hamstrings */}
        <path d="M91 228 C97 225 105 228 106.5 238 C108 252 104 264 99.5 270 C95 268 91.5 258 90.5 246 C90 238 89.5 232 91 228 Z" className="shape muscle" />
        {/* calf (gastrocnemius) */}
        <path d="M92 285 C98 279.5 106 283.5 107 295 C108 306 104 316 99 319 C94 316 90 306 89.8 296 C89.7 290 90 287 92 285 Z" className="shape muscle calf" />
        <path d="M98.5 287 C98.8 297 99 307 99 317" className="detail" />
      </>,
    ),
    hit: both(
      <>
        <ellipse cx="123" cy="89" rx="9" ry="13" />
        <ellipse cx="126" cy="126" rx="5" ry="20" />
        <ellipse cx="95" cy="208" rx="15" ry="17" />
        <ellipse cx="98.5" cy="248" rx="10" ry="22" />
        <ellipse cx="98.5" cy="300" rx="10" ry="21" />
      </>,
    ),
    badge: [118, 300],
  },
  {
    id: "lungs",
    art: (
      <g transform={MIRROR}>
        <path d="M75 82 C66 84 60 94 58.5 110 C57.5 124 59.5 135 63.5 140 C68.5 142.5 74 139 76 132 C77 118 77 98 75 82 Z" className="shape organ lung behind" />
        <path d="M85 86 C88 83 93 82 96 84.5 C101.5 89 102.5 103 102.5 115 C102.5 128 100.5 136 96.5 140 C92.5 141 89.5 139 88.5 135 C92 130 93 124 91 119 C89 112 86 104 85 86 Z" className="shape organ lung behind" />
      </g>
    ),
    hit: (
      <g transform={MIRROR}>
        <path d="M75 80 C64 82 56 94 56 110 C55 126 58 137 63 142 C70 145 77 138 78 130 Z" />
        <path d="M84 84 C89 80 95 80 98 83 C104 88 105 104 105 116 C105 130 102 138 97 142 C91 143 88 140 87 134 Z" />
      </g>
    ),
    badge: [52, 116],
  },
  {
    id: "vessels",
    art: (
      <>
        {/* descending aorta (person's left of the spine = viewer's left), popliteal arteries behind the knees */}
        <path d="M75 92 L75.5 150 L78 193" className="line vessel artery" />
        {both(<path d="M96 262 C97 272 97.5 280 97.5 290" className="line vessel artery thinV" />)}
        {both(<path d="M88.5 50 C89 60 89 70 88.5 78" className="line vessel vein" />)}
      </>
    ),
    hit: (
      <>
        <path d="M75 92 L75.5 150 L78 193" className="hitStroke" />
        {both(<path d="M96 262 L97.5 290" className="hitStroke wide" />)}
      </>
    ),
    badge: [110, 276],
  },
  {
    id: "skeleton",
    art: (
      <>
        {/* scapulae */}
        {both(<path d="M90 76 C98 74 108 75 113 78 C111 88 107 100 101 110 C97 104 93 92 90 76 Z" className="shape boneShape" />)}
        {both(<path d="M93 80 C99 79 106 80 111 82" className="detail" />)}
        {/* posterior ribs */}
        {both(
          <>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <path key={i} d={`M83 ${84 + i * 8} C93 ${82 + i * 8} 102 ${86 + i * 8} 105 ${96 + i * 8}`} className="line bone rib" />
            ))}
          </>,
        )}
        {/* spine: cervical to lumbar, then sacrum */}
        {Array.from({ length: 20 }, (_, i) => (
          <rect key={i} x={77.6 - (i > 12 ? 0.6 : 0)} y={56 + i * 7} width={4.8 + (i > 12 ? 1.2 : 0)} height="5" rx="1.6" className="shape vertebra" />
        ))}
        <path d="M76 196 L84 196 L81.5 212 L78.5 212 Z" className="shape boneShape" />
        {PELVIS}
        {LIMB_BONES}
      </>
    ),
    hit: (
      <>
        <rect x="73" y="54" width="14" height="160" rx="5" />
        {both(<path d="M89 74 C98 72 109 73 115 77 C113 89 108 102 101 113 C96 106 91 93 89 74 Z" />)}
        {pelvisHit}
        {limbBoneHits}
      </>
    ),
    badge: [62, 72],
  },
  {
    id: "kidneys",
    art: (
      <>
        {/* person's left kidney (viewer's left) sits a little higher */}
        <path d="M66 145 C59 145 56 153 56 160 C56 168 59.5 174 66 174 C69.5 174 70.8 170.5 69.6 167 C68.5 164 68.5 158 69.6 155 C70.8 151 70.5 145 66 145 Z" className="shape organ kidney" />
        <path d="M94 150 C101 150 104 158 104 165 C104 173 100.5 179 94 179 C90.5 179 89.2 175.5 90.4 172 C91.5 169 91.5 163 90.4 160 C89.2 156 89.5 150 94 150 Z" className="shape organ kidney" />
        {/* ureters */}
        <path d="M69.5 161 C72 175 75 190 78 204" className="line ureter" />
        <path d="M90.5 166 C88 179 85 192 82 204" className="line ureter" />
      </>
    ),
    hit: (
      <>
        <ellipse cx="63.5" cy="159.5" rx="11" ry="18" />
        <ellipse cx="96.5" cy="164.5" rx="11" ry="18" />
      </>
    ),
    badge: [110, 152],
  },
  {
    id: "brain",
    art: (
      <>
        <path d={BRAIN} className="shape organ" />
        <path d={GYRI} className="detail" />
        {/* cerebellum */}
        <path d="M72 36 C74 33 86 33 88 36 C88 39.5 84 41 80 41 C76 41 72 39.5 72 36 Z" className="shape organ" />
        <path d="M74 37 C78 38.5 82 38.5 86 37" className="detail" />
      </>
    ),
    hit: <ellipse cx="80" cy="27" rx="15" ry="15" />,
    badge: [98, 15],
  },
  {
    id: "whole_body",
    art: <path d={RING_FRONT} className="line ring" />,
    hit: wholeHit,
    badge: [153, 192],
  },
];

export const ART_BY_VIEW: Record<View, RegionArt[]> = { anterior: ANTERIOR, posterior: POSTERIOR };
