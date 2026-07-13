# Input and Output Formats

## PNH Matrix Format

```text
<place-count>
<transition-count>
<transition/place matrix rows>
<initial marking>
;optional metadata
```

Matrix symbols:

- `x` or `X`: arc from place to transition.
- `1..9`: arc from transition to place with the given weight.
- `0`: no arc.

## PNH Section Format

```text
PNH 1.0
[PLACES]
P1 label="P1" tokens=1 x=0 y=0

[TRANSITIONS]
T1 label="t1" x=0 y=0 angle=0

[ARCS]
A1 P1 -> T1 weight=1

[MARKING]
P1=1
END
```

## Research Exports

POOH exports benchmark and research artifacts as:

- JSON for complete machine-readable results,
- CSV for tables and post-processing,
- LaTeX snippets for publication tables,
- plain text reports for review and archiving.

Benchmark CSV exports include requested/used acceleration modes for Martinez-Silva and XTREC, `xCPU` speedup values, structural XT-condition statuses and browser/platform metadata (`env_platform`, logical CPU count, declared device memory, WebGPU/WebGL availability and user agent).

Benchmark profile CSV exports use:

```text
library,file,size_bytes,format,places,transitions,arcs,marked_places,tokens_total,arc_density,warnings,error
```

Representative benchmark sample CSV exports from `scripts/profile_pnh_library.js --sample-output=...` use:

```text
rank,library,file,size_stratum,selection_reason,complexity,places,transitions,arcs,arc_density,warnings,error
```
