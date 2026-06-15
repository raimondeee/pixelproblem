interface UnitCubeStacksProps {
  stacks: number[];
  active: boolean;
  onRemoveCube: (stackIndex: number) => void;
}

export function UnitCubeStacks({ stacks, active, onRemoveCube }: UnitCubeStacksProps) {
  const visibleStacks = stacks
    .map((count, stackIndex) => ({ count, stackIndex }))
    .filter(({ count }) => count > 0);

  if (visibleStacks.length === 0) {
    return null;
  }

  return (
    <div className="unit-cubes" aria-label="Unit cube stacks">
      <div className="unit-cubes__stacks">
        {visibleStacks.map(({ count, stackIndex }) => (
          <div key={stackIndex} className="unit-cubes__stack">
            {Array.from({ length: count }, (_, cubeIndex) => (
              <span
                key={cubeIndex}
                className="unit-cubes__cube"
                onClick={(event) => {
                  if (!active || cubeIndex !== count - 1) {
                    return;
                  }
                  event.stopPropagation();
                  onRemoveCube(stackIndex);
                }}
                role="presentation"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
