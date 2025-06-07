-- pokeraid.shop definition

CREATE TABLE `shop` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('POKEMON','ITEM') NOT NULL,
  `target_id` int NOT NULL,
  `price` int NOT NULL,
  `stock` int DEFAULT '-1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


INSERT INTO shop (type, target_id, price, stock) VALUES
('POKEMON', 1, 12, 10),
('POKEMON', 2, 18, 15),
('POKEMON', 3, 15, 8),
('POKEMON', 4, 17, 12),
('POKEMON', 5, 20, 5),
('POKEMON', 6, 11, 9),
('POKEMON', 7, 16, 11),
('POKEMON', 8, 19, 7),
('POKEMON', 9, 14, 20),
('POKEMON', 10, 13, 3);
