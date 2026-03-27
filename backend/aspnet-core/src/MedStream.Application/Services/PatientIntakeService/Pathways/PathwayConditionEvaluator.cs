using Abp.Dependency;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json;

namespace MedStream.PatientIntake.Pathways;

/// <summary>
/// Evaluates pathway rule conditions against runtime context.
/// </summary>
public class PathwayConditionEvaluator : IPathwayConditionEvaluator, ITransientDependency
{
    /// <inheritdoc />
    public bool Evaluate(PathwayConditionJson condition, IReadOnlyDictionary<string, object> context)
    {
        if (condition == null)
        {
            return true;
        }

        if (condition.All.Count > 0)
        {
            return condition.All.All(item => Evaluate(item, context));
        }

        if (condition.Any.Count > 0)
        {
            return condition.Any.Any(item => Evaluate(item, context));
        }

        if (string.IsNullOrWhiteSpace(condition.Input) || string.IsNullOrWhiteSpace(condition.Operator))
        {
            return true;
        }

        if (!context.TryGetValue(condition.Input, out var rawLeft) || rawLeft == null)
        {
            return false;
        }

        var left = NormalizeObject(rawLeft);
        var right = condition.Value.HasValue ? NormalizeJsonElement(condition.Value.Value) : null;

        return condition.Operator.ToLowerInvariant() switch
        {
            "equals" => AreEqual(left, right),
            "notequals" => !AreEqual(left, right),
            "lt" => CompareNumbers(left, right, (l, r) => l < r),
            "lte" => CompareNumbers(left, right, (l, r) => l <= r),
            "gt" => CompareNumbers(left, right, (l, r) => l > r),
            "gte" => CompareNumbers(left, right, (l, r) => l >= r),
            "contains" => ContainsValue(left, right),
            _ => false
        };
    }

    private static object NormalizeObject(object value)
    {
        if (value is JsonElement jsonElement)
        {
            return NormalizeJsonElement(jsonElement);
        }

        if (value is IEnumerable<object> objectValues && value is not string)
        {
            return objectValues.Select(NormalizeObject).ToList();
        }

        if (value is IEnumerable enumerableValues && value is not string)
        {
            var normalized = new List<object>();
            foreach (var item in enumerableValues)
            {
                normalized.Add(NormalizeObject(item));
            }

            return normalized;
        }

        return value;
    }

    private static object NormalizeJsonElement(JsonElement value)
    {
        return value.ValueKind switch
        {
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Number when value.TryGetDecimal(out var decimalValue) => decimalValue,
            JsonValueKind.String => value.GetString(),
            JsonValueKind.Array => value.EnumerateArray().Select(NormalizeJsonElement).ToList(),
            _ => value.ToString()
        };
    }

    private static bool AreEqual(object left, object right)
    {
        if (left is bool leftBool && right is bool rightBool)
        {
            return leftBool == rightBool;
        }

        if (TryConvertToDecimal(left, out var leftNumber) && TryConvertToDecimal(right, out var rightNumber))
        {
            return leftNumber == rightNumber;
        }

        return string.Equals(Convert.ToString(left, CultureInfo.InvariantCulture), Convert.ToString(right, CultureInfo.InvariantCulture), StringComparison.OrdinalIgnoreCase);
    }

    private static bool CompareNumbers(object left, object right, Func<decimal, decimal, bool> comparator)
    {
        if (!TryConvertToDecimal(left, out var leftNumber))
        {
            return false;
        }

        if (!TryConvertToDecimal(right, out var rightNumber))
        {
            return false;
        }

        return comparator(leftNumber, rightNumber);
    }

    private static bool ContainsValue(object left, object right)
    {
        if (left is IEnumerable<object> values && left is not string)
        {
            return values.Any(item => AreEqual(item, right));
        }

        if (left is IEnumerable enumerableValues && left is not string)
        {
            foreach (var item in enumerableValues)
            {
                if (AreEqual(item, right))
                {
                    return true;
                }
            }
        }

        return false;
    }

    private static bool TryConvertToDecimal(object value, out decimal number)
    {
        if (value is decimal decimalValue)
        {
            number = decimalValue;
            return true;
        }

        if (value is int intValue)
        {
            number = intValue;
            return true;
        }

        if (value is long longValue)
        {
            number = longValue;
            return true;
        }

        if (value is double doubleValue)
        {
            number = Convert.ToDecimal(doubleValue);
            return true;
        }

        if (value is string stringValue && decimal.TryParse(stringValue, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed))
        {
            number = parsed;
            return true;
        }

        number = 0;
        return false;
    }
}
