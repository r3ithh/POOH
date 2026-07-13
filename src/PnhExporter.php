<?php
declare(strict_types=1);

require_once __DIR__ . '/I18n.php';

final class PnhExporter
{
    /**
     * @param array<string,mixed> $payload
     */
    public function export(array $payload): string
    {
        $nodes = $payload['nodes'] ?? null;
        $arcs = $payload['arcs'] ?? null;

        if (!is_array($nodes) || !is_array($arcs)) {
            throw new InvalidArgumentException(PoohI18n::translate('export.nodesArcsInvalid'));
        }

        $places = [];
        $transitions = [];

        foreach ($nodes as $node) {
            if (!is_array($node)) {
                throw new InvalidArgumentException(PoohI18n::translate('export.nodeObjectRequired'));
            }
            $id = $this->requiredString($node, 'id');
            $type = $this->requiredString($node, 'type');
            $label = $this->optionalString($node, 'label', $id);
            $x = $this->optionalInt($node, 'x', 0);
            $y = $this->optionalInt($node, 'y', 0);

            if ($type === 'place') {
                $tokens = $this->optionalInt($node, 'tokens', 0);
                if ($tokens < 0) {
                    throw new InvalidArgumentException(PoohI18n::translate('export.placeTokensNegative', ['id' => $id]));
                }
                $places[$id] = [
                    'id' => $id,
                    'label' => $label,
                    'tokens' => $tokens,
                    'x' => $x,
                    'y' => $y,
                ];
                continue;
            }

            if ($type === 'transition') {
                $angle = $this->normalizeAngle($this->optionalInt($node, 'angle', 0));
                $transitions[$id] = [
                    'id' => $id,
                    'label' => $label,
                    'x' => $x,
                    'y' => $y,
                    'angle' => $angle,
                ];
                continue;
            }

            throw new InvalidArgumentException(PoohI18n::translate('export.nodeTypeUnknown', ['type' => $type]));
        }

        $allNodes = $places + $transitions;
        if ($allNodes === []) {
            throw new InvalidArgumentException(PoohI18n::translate('export.netEmpty'));
        }

        $lines = [];
        $lines[] = 'PNH 1.0';
        $lines[] = 'META generated=' . date(DATE_ATOM);
        $lines[] = '';
        $lines[] = '[PLACES]';
        foreach ($places as $place) {
            $lines[] = sprintf(
                '%s label="%s" tokens=%d x=%d y=%d',
                $place['id'],
                $this->escape($place['label']),
                $place['tokens'],
                $place['x'],
                $place['y']
            );
        }
        $lines[] = '';
        $lines[] = '[TRANSITIONS]';
        foreach ($transitions as $transition) {
            $lines[] = sprintf(
                '%s label="%s" x=%d y=%d angle=%d',
                $transition['id'],
                $this->escape($transition['label']),
                $transition['x'],
                $transition['y'],
                $transition['angle']
            );
        }
        $lines[] = '';
        $lines[] = '[ARCS]';

        foreach ($arcs as $arc) {
            if (!is_array($arc)) {
                throw new InvalidArgumentException(PoohI18n::translate('export.arcObjectRequired'));
            }
            $arcId = $this->requiredString($arc, 'id');
            $from = $this->requiredString($arc, 'from');
            $to = $this->requiredString($arc, 'to');
            $weight = $this->optionalInt($arc, 'weight', 1);

            if ($weight < 1) {
                throw new InvalidArgumentException(PoohI18n::translate('export.arcWeightInvalid', ['id' => $arcId]));
            }

            if (!isset($allNodes[$from], $allNodes[$to])) {
                throw new InvalidArgumentException(PoohI18n::translate('export.arcNodesMissing', ['id' => $arcId]));
            }

            $fromIsPlace = isset($places[$from]);
            $toIsPlace = isset($places[$to]);
            if ($fromIsPlace === $toIsPlace) {
                throw new InvalidArgumentException(PoohI18n::translate('export.arcBipartiteRequired', [
                    'id' => $arcId,
                    'from' => $from,
                    'to' => $to,
                ]));
            }

            $lines[] = sprintf('%s %s -> %s weight=%d', $arcId, $from, $to, $weight);
        }

        $lines[] = '';
        $lines[] = '[MARKING]';
        foreach ($places as $place) {
            $lines[] = sprintf('%s=%d', $place['id'], $place['tokens']);
        }
        $lines[] = '';
        $lines[] = 'END';

        return implode(PHP_EOL, $lines) . PHP_EOL;
    }

    /**
     * @param array<string,mixed> $data
     */
    private function requiredString(array $data, string $key): string
    {
        $value = $data[$key] ?? null;
        if (!is_string($value) || trim($value) === '') {
            throw new InvalidArgumentException(PoohI18n::translate('export.fieldRequired', ['field' => $key]));
        }
        return trim($value);
    }

    /**
     * @param array<string,mixed> $data
     */
    private function optionalString(array $data, string $key, string $fallback): string
    {
        $value = $data[$key] ?? null;
        if (!is_string($value) || trim($value) === '') {
            return $fallback;
        }
        return trim($value);
    }

    /**
     * @param array<string,mixed> $data
     */
    private function optionalInt(array $data, string $key, int $fallback): int
    {
        $value = $data[$key] ?? null;
        if (is_int($value)) {
            return $value;
        }
        if (is_numeric($value)) {
            return (int) $value;
        }
        return $fallback;
    }

    private function escape(string $value): string
    {
        $value = str_replace('\\', '\\\\', $value);
        $value = str_replace('"', '\\"', $value);
        return str_replace(["\r", "\n"], ['\\r', '\\n'], $value);
    }

    private function normalizeAngle(int $value): int
    {
        $snapped = (int) (round($value / 45) * 45);
        return ($snapped % 360 + 360) % 360;
    }
}
