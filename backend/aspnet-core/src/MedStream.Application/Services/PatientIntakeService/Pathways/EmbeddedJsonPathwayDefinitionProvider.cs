using Abp.Dependency;
using Abp.UI;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;

namespace MedStream.PatientIntake.Pathways;

/// <summary>
/// Loads pathway definitions from embedded JSON files.
/// </summary>
public class EmbeddedJsonPathwayDefinitionProvider : IPathwayDefinitionProvider, ISingletonDependency
{
    private readonly IReadOnlyDictionary<string, PathwayDefinitionJson> _definitions;

    /// <summary>
    /// Initializes a new instance of the <see cref="EmbeddedJsonPathwayDefinitionProvider"/> class.
    /// </summary>
    public EmbeddedJsonPathwayDefinitionProvider(PathwayDefinitionValidator validator)
    {
        var assembly = typeof(EmbeddedJsonPathwayDefinitionProvider).Assembly;
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var definitions = new Dictionary<string, PathwayDefinitionJson>(StringComparer.OrdinalIgnoreCase);
        var resourceNames = assembly.GetManifestResourceNames()
            .Where(name => name.Contains(".Pathways.Definitions.", StringComparison.OrdinalIgnoreCase) &&
                           name.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
            .ToList();

        foreach (var resourceName in resourceNames)
        {
            using var stream = assembly.GetManifestResourceStream(resourceName);
            if (stream == null)
            {
                continue;
            }

            using var reader = new StreamReader(stream);
            var json = reader.ReadToEnd();
            var definition = JsonSerializer.Deserialize<PathwayDefinitionJson>(json, options);
            if (definition == null)
            {
                throw new UserFriendlyException($"Failed to deserialize pathway JSON resource '{resourceName}'.");
            }

            validator.Validate(definition);
            definitions[definition.Id] = definition;
        }

        _definitions = definitions;
    }

    /// <inheritdoc />
    public PathwayDefinitionJson GetById(string pathwayId)
    {
        if (string.IsNullOrWhiteSpace(pathwayId))
        {
            throw new UserFriendlyException("Pathway id is required.");
        }

        if (!_definitions.TryGetValue(pathwayId, out var definition))
        {
            throw new UserFriendlyException($"Pathway '{pathwayId}' was not found.");
        }

        return definition;
    }

    /// <inheritdoc />
    public IReadOnlyCollection<PathwayDefinitionJson> GetAllActive()
    {
        return _definitions.Values
            .Where(item => string.Equals(item.Status, "active", StringComparison.OrdinalIgnoreCase))
            .ToList();
    }
}
