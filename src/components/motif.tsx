import { useId } from "react";
export function Motif({
  kind = "moth",
  className = "",
  draw = false,
}: {
  kind?: "moth" | "bloom" | "serpent";
  className?: string;
  draw?: boolean;
}) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 500 600"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className={`${className} ${draw ? "draw-motif" : ""}`}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={id}
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(30)"
        >
          <path d="M0 0V8" stroke="currentColor" strokeWidth=".5" />
        </pattern>
      </defs>
      <g>
        {kind === "moth" ? (
          <>
            <path
              d="M250 208C200 110 110 110 35 70C22 195 61 280 223 310C133 286 81 330 75 417C166 411 206 370 240 328M250 208C300 110 390 110 465 70C478 195 439 280 277 310C367 286 419 330 425 417C334 411 294 370 260 328"
              fill={`url(#${id})`}
            />
            <path d="M246 214C233 270 235 322 250 366C265 322 267 270 254 214ZM242 215L222 180M258 215L278 180M224 290C174 262 103 241 56 128C130 155 184 198 225 260M276 290C326 262 397 241 444 128C370 155 316 198 275 260M229 316L101 389M271 316L399 389" />
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <ellipse
                  cx={118 + i * 39}
                  cy={210 + i * 22}
                  rx="11"
                  ry="21"
                  transform={`rotate(-35 ${118 + i * 39} ${210 + i * 22})`}
                />
                <ellipse
                  cx={382 - i * 39}
                  cy={210 + i * 22}
                  rx="11"
                  ry="21"
                  transform={`rotate(35 ${382 - i * 39} ${210 + i * 22})`}
                />
              </g>
            ))}
            <path d="M250 92V34M235 49L250 25L265 49M250 392V466M230 451L250 480L270 451M178 81A84 84 0 0 1 322 81M165 73A100 100 0 0 1 335 73" />
            <circle cx="250" cy="123" r="24" />
            <path d="M240 104A24 24 0 0 0 262 143" />
          </>
        ) : kind === "bloom" ? (
          <>
            <path d="M249 536C277 400 213 302 253 193M247 436C193 432 123 389 109 328C184 330 220 372 247 436ZM255 368C319 352 361 312 381 252C303 257 270 305 255 368ZM244 294C188 278 153 241 147 200C204 208 234 242 244 294Z" />
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <path
                key={a}
                d="M250 200C163 158 181 82 227 109C239 42 290 56 279 117C342 96 335 158 250 200Z"
                transform={`rotate(${a} 250 200)`}
                fill={`url(#${id})`}
              />
            ))}
            <circle cx="250" cy="200" r="24" />
            <circle cx="250" cy="200" r="10" />
            <path d="M82 441L95 417L108 441L95 465ZM359 450L370 429L381 450L370 471M144 101V68M128 84H160" />
          </>
        ) : (
          <>
            <path
              d="M300 74C129 52 104 214 237 249C394 290 364 425 220 443C104 456 98 342 176 326C243 311 260 367 209 388M301 103C175 77 150 192 248 219C448 273 405 468 224 475C64 483 43 316 162 295C272 271 317 397 216 419"
              fill={`url(#${id})`}
            />
            <path d="M299 74L347 91L316 120L301 103M334 99L368 113L383 101M368 113L378 133M220 443L193 526L224 475M284 82L285 96" />
            <circle cx="308" cy="94" r="3" />
            <circle cx="247" cy="281" r="181" strokeDasharray="2 9" />
            <path d="M250 50V20M235 35H265M250 550V580M235 565H265" />
          </>
        )}
      </g>
    </svg>
  );
}
