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
/// APC catalog provider contract.
/// </summary>
public interface IApcCatalogProvider
{
    /// <summary>
    /// Gets all catalog sections.
    /// </summary>
    IReadOnlyCollection<ApcCatalogSectionJson> GetAllSections();
}

/// <summary>
/// APC summaries provider contract.
/// </summary>
public interface IApcSummaryProvider
{
    /// <summary>
    /// Gets all fallback summaries.
    /// </summary>
    IReadOnlyCollection<ApcSummaryJson> GetAllSummaries();

    /// <summary>
    /// Gets summaries by ids.
    /// </summary>
    IReadOnlyCollection<ApcSummaryJson> GetByIds(IReadOnlyCollection<string> ids);
}

/// <summary>
/// Embedded provider for APC catalog JSON.
/// </summary>
public class EmbeddedApcCatalogProvider : IApcCatalogProvider, ISingletonDependency
{
    private readonly IReadOnlyCollection<ApcCatalogSectionJson> _sections;

    /// <summary>
    /// Initializes a new instance of the <see cref="EmbeddedApcCatalogProvider"/> class.
    /// </summary>
    public EmbeddedApcCatalogProvider()
    {
        var catalog = ReadEmbeddedJson<ApcCatalogJson>("apc-catalog.v1.json");
        _sections = catalog.Sections ?? new List<ApcCatalogSectionJson>();
    }

    /// <inheritdoc />
    public IReadOnlyCollection<ApcCatalogSectionJson> GetAllSections()
    {
        return _sections;
    }

    private static TModel ReadEmbeddedJson<TModel>(string fileName)
    {
        var assembly = typeof(EmbeddedApcCatalogProvider).Assembly;
        var resourceName = assembly.GetManifestResourceNames()
            .FirstOrDefault(name => name.EndsWith(fileName, StringComparison.OrdinalIgnoreCase));
        if (resourceName == null)
        {
            throw new UserFriendlyException($"Embedded APC resource '{fileName}' was not found.");
        }

        using var stream = assembly.GetManifestResourceStream(resourceName);
        if (stream == null)
        {
            throw new UserFriendlyException($"Embedded APC resource stream '{resourceName}' is unavailable.");
        }

        using var reader = new StreamReader(stream);
        var payload = reader.ReadToEnd();
        var model = JsonSerializer.Deserialize<TModel>(payload, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
        if (model == null)
        {
            throw new UserFriendlyException($"Embedded APC resource '{fileName}' could not be deserialized.");
        }

        return model;
    }
}

/// <summary>
/// Embedded provider for APC fallback summaries JSON.
/// </summary>
public class EmbeddedApcSummaryProvider : IApcSummaryProvider, ISingletonDependency
{
    private readonly IReadOnlyCollection<ApcSummaryJson> _summaries;

    /// <summary>
    /// Initializes a new instance of the <see cref="EmbeddedApcSummaryProvider"/> class.
    /// </summary>
    public EmbeddedApcSummaryProvider()
    {
        var assembly = typeof(EmbeddedApcSummaryProvider).Assembly;
        var resourceName = assembly.GetManifestResourceNames()
            .FirstOrDefault(name => name.EndsWith("apc-summaries.v1.json", StringComparison.OrdinalIgnoreCase));
        if (resourceName == null)
        {
            throw new UserFriendlyException("Embedded APC summaries resource was not found.");
        }

        using var stream = assembly.GetManifestResourceStream(resourceName);
        if (stream == null)
        {
            throw new UserFriendlyException("Embedded APC summaries stream is unavailable.");
        }

        using var reader = new StreamReader(stream);
        var payload = reader.ReadToEnd();
        var parsed = JsonSerializer.Deserialize<ApcSummariesJson>(payload, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
        if (parsed == null)
        {
            throw new UserFriendlyException("Embedded APC summaries payload could not be parsed.");
        }

        _summaries = parsed.Summaries ?? new List<ApcSummaryJson>();
    }

    /// <inheritdoc />
    public IReadOnlyCollection<ApcSummaryJson> GetAllSummaries()
    {
        return _summaries;
    }

    /// <inheritdoc />
    public IReadOnlyCollection<ApcSummaryJson> GetByIds(IReadOnlyCollection<string> ids)
    {
        if (ids == null || ids.Count == 0)
        {
            return Array.Empty<ApcSummaryJson>();
        }

        var selected = new HashSet<string>(ids.Where(item => !string.IsNullOrWhiteSpace(item)), StringComparer.OrdinalIgnoreCase);
        return _summaries.Where(item => selected.Contains(item.Id)).ToList();
    }
}
