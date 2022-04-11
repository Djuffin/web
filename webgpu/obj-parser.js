function parseOBJ(text) {
  const lines = text.split('\n');
  const result = {
    verteces : [{x:0.0, y:0.0, z:0.0}],
    triangles : []
  };

  function addVertex(parts) {
    if (parts.length < 3)
      return;
    result.verteces.push({
      x: parseFloat(parts[0]),
      y: parseFloat(parts[1]),
      z: parseFloat(parts[2])
    });
  }

  function addFace(parts) {
    const points = parts.map(part => parseInt(part.split('/')[0]));
    const triangles = points.length - 2;
    if (triangles < 1)
      return;
    for (let i = 0; i < triangles; i++)
      result.triangles.push([points[0], points[i + 1], points[i + 2]]);
  }

  const keywordRE = /(v|f)\s+(.*)/;
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    switch (keyword) {
      case "v":
        addVertex(parts);
        break
      case "f":
        addFace(parts);
        break;
    }
  }

  return result;
}