using System.ComponentModel.DataAnnotations;

namespace MedStream.Users.Dto;

public class ChangeUserLanguageDto
{
    [Required]
    public string LanguageName { get; set; }
}