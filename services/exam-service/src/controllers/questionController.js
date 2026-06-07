exports.getQuestions = async (req, res) => {
  return res.status(200).json({
    success: true,
    questions: [
      {
        _id: "q1",
        text: "Aşağıdaki integrali çözünüz: ∫x² dx",
        options: ["A) x³/3 + C", "B) x³ + C", "C) 2x + C", "D) x²/2 + C"],
        correctOption: 0
      },
      {
        _id: "q2",
        text: "Hangi dilde 'print' komutu ekrana yazı yazdırmak için kullanılır?",
        options: ["A) Python", "B) HTML", "C) CSS", "D) SQL"],
        correctOption: 0
      }
    ],
    examId: req.params.id,
  });
};

exports.addQuestion = async (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'Soru ekleme endpoint iskeleti hazır. Bu görev Koray/ilgili backend göreviyle tamamlanacak.',
  });
};

exports.updateQuestion = async (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'Soru güncelleme endpoint iskeleti hazır.',
  });
};

exports.deleteQuestion = async (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'Soru silme endpoint iskeleti hazır.',
  });
};
