-- Khởi tạo database và charset
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+07:00";

-- Tạo database nếu chưa tồn tại
CREATE DATABASE IF NOT EXISTS `db_sinhvien` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `db_sinhvien`;

-- Tắt kiểm tra khóa ngoại tạm thời để tránh lỗi khi tạo bảng
SET FOREIGN_KEY_CHECKS = 0;

-- Tạo bảng quyenhan trước vì nhiều bảng khác tham chiếu đến nó
CREATE TABLE IF NOT EXISTS `quyenhan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ten_quyen` varchar(50) NOT NULL,
  `mo_ta` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `quyenhan` (`ten_quyen`, `mo_ta`) VALUES
('ADMIN', 'Quyền quản trị hệ thống'),
('GIANGVIEN', 'Quyền dành cho giảng viên'),
('SINHVIEN', 'Quyền dành cho sinh viên');

-- Tạo bảng khoa (departments)
CREATE TABLE IF NOT EXISTS `khoa` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ma_khoa` varchar(10) NOT NULL,
  `ten_khoa` varchar(100) NOT NULL,
  `mo_ta` text DEFAULT NULL,
  `truong_khoa` varchar(100) DEFAULT NULL,
  `ngay_thanh_lap` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_khoa` (`ma_khoa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `khoa` (`ma_khoa`, `ten_khoa`, `mo_ta`, `truong_khoa`, `ngay_thanh_lap`) VALUES
('KTCN', 'Khoa Kỹ thuật - Công nghệ', 'Ngành Công nghệ thông tin', 'Bui Xuan Tung', NULL),
('DDD', 'Khoa Dược điều dưỡng', 'Ngành Dược Điều Dưỡng', NULL, NULL),
('KT_TC_NH', 'Kế toán - Tài Chính- Ngân Hàng', 'Ngành Kế toán - Tài Chính - Ngân Hàng', NULL, NULL),
('DLKS', 'Du lịch & Khách sạn', 'Ngành Du lịch và Khách sạn', NULL, NULL),
('TKDH', 'Thiết kế đồ họa', 'Ngành Thiết kế đồ họa', NULL, NULL);

-- Tạo bảng giangvien
CREATE TABLE IF NOT EXISTS `giangvien` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ma_gv` varchar(10) NOT NULL,
  `ho_ten` varchar(100) NOT NULL,
  `ngay_sinh` date DEFAULT NULL,
  `gioi_tinh` enum('Nam','Nữ','Khác') DEFAULT NULL,
  `dia_chi` text DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `so_dien_thoai` varchar(20) DEFAULT NULL,
  `chuyen_mon` varchar(100) DEFAULT NULL,
  `hoc_vi` varchar(50) DEFAULT NULL,
  `trang_thai` enum('Đang dạy','Nghỉ phép','Đã nghỉ việc') DEFAULT 'Đang dạy',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_gv` (`ma_gv`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng nganh
CREATE TABLE IF NOT EXISTS `nganh` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ma_nganh` varchar(10) NOT NULL,
  `ten_nganh` varchar(100) NOT NULL,
  `mo_ta` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_nganh` (`ma_nganh`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `nganh` (`id`, `ma_nganh`, `ten_nganh`, `mo_ta`) VALUES
(1, 'CNTT', 'Công nghệ thông tin', 'Ngành Công nghệ thông tin'),
(2, 'QTKD', 'Quản trị kinh doanh', 'Ngành Quản trị kinh doanh'),
(3, 'KT', 'Kế toán', 'Ngành Kế toán'),
(4, 'DLKS', 'Du lịch & Khách sạn', 'Ngành Du lịch và Khách sạn'),
(5, 'TKDH', 'Thiết kế đồ họa', 'Ngành Thiết kế đồ họa');

-- Tạo bảng lop
CREATE TABLE IF NOT EXISTS `lop` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ma_lop` varchar(10) NOT NULL,
  `ten_lop` varchar(50) NOT NULL,
  `khoa_id` int(11) NOT NULL,
  `nam_nhap_hoc` int(11) DEFAULT NULL,
  `nien_khoa` varchar(20) DEFAULT NULL,
  `si_so_toi_da` int(11) DEFAULT 50,
  `co_van_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_lop` (`ma_lop`),
  KEY `lop_ibfk_4` (`khoa_id`),
  KEY `lop_ibfk_5` (`co_van_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `lop` (`id`, `ma_lop`, `ten_lop`, `khoa_id`, `nam_nhap_hoc`) VALUES
(1, 'CNTT01', 'Lớp CNTT 01', 1, 2023),
(2, 'CNTT02', 'Lớp CNTT 02', 1, 2022),
(3, 'QTKD01', 'Lớp QTKD 01', 2, 2023),
(4, 'KT01', 'Lớp Kế toán 01', 3, 2023),
(5, 'DLKS01', 'Lớp Du lịch 01', 4, 2022);

-- Tạo bảng sinhvien
CREATE TABLE IF NOT EXISTS `sinhvien` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ma_sv` varchar(10) NOT NULL,
  `ho_ten` varchar(100) NOT NULL,
  `ngay_sinh` date DEFAULT NULL,
  `gioi_tinh` enum('Nam','Nữ','Khác') DEFAULT NULL,
  `dia_chi` text DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `so_dien_thoai` varchar(20) DEFAULT NULL,
  `lop_id` int(11) DEFAULT NULL,
  `trang_thai` enum('Đang học','Đã tốt nghiệp','Nghỉ học','Đình chỉ') DEFAULT 'Đang học',
  `dan_toc` varchar(50) DEFAULT NULL,
  `ton_giao` varchar(50) DEFAULT NULL,
  `ma_so_the_bhyt` varchar(20) DEFAULT NULL,
  `truong_thpt` varchar(100) DEFAULT NULL,
  `nam_tot_nghiep_thpt` int(11) DEFAULT NULL,
  `phuong_xa_thpt` varchar(100) DEFAULT NULL,
  `quan_huyen_thpt` varchar(100) DEFAULT NULL,
  `tinh_thanh_thpt` varchar(100) DEFAULT NULL,
  `ho_ten_phu_huynh` varchar(100) DEFAULT NULL,
  `dia_chi_phu_huynh` text DEFAULT NULL,
  `sdt_phu_huynh` varchar(20) DEFAULT NULL,
  `avatar` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_sv` (`ma_sv`),
  KEY `lop_id` (`lop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng monhoc
CREATE TABLE IF NOT EXISTS `monhoc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ma_mon` varchar(10) NOT NULL,
  `ten_mon` varchar(100) NOT NULL,
  `so_tin_chi` int(11) NOT NULL,
  `mo_ta` text DEFAULT NULL,
  `ma_nganh` varchar(10) DEFAULT NULL,
  `tong_so_tiet_ly_thuyet` int(11) DEFAULT 0,
  `tong_so_tiet_thuc_hanh` int(11) DEFAULT 0,
  `mon_hoc_tien_quyet` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_mon` (`ma_mon`),
  KEY `ma_nganh` (`ma_nganh`),
  KEY `mon_hoc_tien_quyet` (`mon_hoc_tien_quyet`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `monhoc` (`id`, `ma_mon`, `ten_mon`, `so_tin_chi`, `mo_ta`, `ma_nganh`, `tong_so_tiet_ly_thuyet`, `tong_so_tiet_thuc_hanh`, `mon_hoc_tien_quyet`) VALUES
(1, 'CTDL', 'Cấu trúc dữ liệu', 3, 'Môn học về cấu trúc dữ liệu', 'CNTT', 45, 45, NULL),
(2, 'HDH', 'Hệ điều hành', 4, 'Môn học về hệ điều hành', 'CNTT', 60, 60, NULL),
(3, 'QLCL', 'Quản lý chất lượng', 2, 'Môn học về quản lý chất lượng', 'QTKD', 30, 30, NULL),
(4, 'KTTC', 'Kế toán tài chính', 3, 'Môn học về kế toán tài chính', 'KT', 45, 45, NULL),
(5, 'DLDL', 'Dẫn lịch du lịch', 2, 'Môn học về hướng dẫn du lịch', 'DLKS', 30, 30, NULL),
(6, 'TKCD', 'Thiết kế cơ bản', 3, 'Môn học về thiết kế đồ họa', 'TKDH', 45, 45, NULL),
(7, 'MH001', 'Toán cao cấp', 2, NULL, NULL, 30, 30, NULL);

-- Tạo bảng taikhoan
CREATE TABLE IF NOT EXISTS `taikhoan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ten_dang_nhap` varchar(50) NOT NULL,
  `mat_khau_hash` varchar(256) NOT NULL,
  `email` varchar(100) NOT NULL,
  `quyen_han_id` int(11) NOT NULL,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `giang_vien_id` int(11) DEFAULT NULL,
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  `lan_dang_nhap_cuoi` datetime DEFAULT NULL,
  `trang_thai` enum('Hoạt động','Khóa','Chờ xác nhận') DEFAULT 'Hoạt động',
  `token_reset_password` varchar(100) DEFAULT NULL,
  `token_expiry` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ten_dang_nhap` (`ten_dang_nhap`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `sinh_vien_id` (`sinh_vien_id`),
  KEY `quyen_han_id` (`quyen_han_id`),
  KEY `giang_vien_id` (`giang_vien_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng cauhinh_taikhoan
CREATE TABLE IF NOT EXISTS `cauhinh_taikhoan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `taikhoan_id` int(11) NOT NULL,
  `xac_thuc_hai_yeu_to` tinyint(1) DEFAULT 0,
  `so_dien_thoai_xac_thuc` varchar(20) DEFAULT NULL,
  `email_xac_thuc` varchar(100) DEFAULT NULL,
  `khoa_tai_khoan_sau_dang_nhap_that_bai` int(11) DEFAULT 5,
  PRIMARY KEY (`id`),
  KEY `taikhoan_id` (`taikhoan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng chitiet_monhoc
CREATE TABLE IF NOT EXISTS `chitiet_monhoc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mon_hoc_id` int(11) NOT NULL,
  `so_tiet_ly_thuyet` int(11) NOT NULL,
  `so_tiet_thuc_hanh` int(11) NOT NULL,
  `so_nhom_thuc_hanh` int(11) DEFAULT 1,
  `ghi_chu` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mon_hoc_id` (`mon_hoc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng dangkyhocphan
CREATE TABLE IF NOT EXISTS `dangkyhocphan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `mon_hoc_id` int(11) DEFAULT NULL,
  `hoc_ky` varchar(20) DEFAULT NULL,
  `nam_hoc` varchar(20) DEFAULT NULL,
  `ngay_dang_ky` datetime DEFAULT CURRENT_TIMESTAMP,
  `trang_thai` enum('Đăng ký','Đã duyệt','Hủy') DEFAULT 'Đăng ký',
  PRIMARY KEY (`id`),
  KEY `sinh_vien_id` (`sinh_vien_id`),
  KEY `mon_hoc_id` (`mon_hoc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$
CREATE TRIGGER `limit_mon_hoc_per_hoc_ky` BEFORE INSERT ON `dangkyhocphan` FOR EACH ROW 
BEGIN
    DECLARE mon_count INT;
    SELECT COUNT(*) INTO mon_count
    FROM `dangkyhocphan`
    WHERE `sinh_vien_id` = NEW.`sinh_vien_id`
    AND `hoc_ky` = NEW.`hoc_ky`
    AND `nam_hoc` = NEW.`nam_hoc`
    AND `trang_thai` IN ('Đăng ký', 'Đã duyệt');
    IF mon_count >= 5 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số lượng môn học tối đa là 5 môn/học kỳ';
    END IF;
END$$
DELIMITER ;

-- Tạo bảng dethi
CREATE TABLE IF NOT EXISTS `dethi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mon_hoc_id` int(11) DEFAULT NULL,
  `giang_vien` varchar(50) DEFAULT NULL,
  `loai_de` enum('Giữa kỳ','Cuối kỳ','Bảo vệ') DEFAULT NULL,
  `nam_hoc` varchar(20) DEFAULT NULL,
  `hoc_ky` varchar(20) DEFAULT NULL,
  `thoi_gian_lam` int(11) DEFAULT NULL,
  `mo_ta` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mon_hoc_id` (`mon_hoc_id`),
  KEY `dethi_giangvien_ibfk_2` (`giang_vien`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng diemdanh
CREATE TABLE IF NOT EXISTS `diemdanh` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `mon_hoc_id` int(11) DEFAULT NULL,
  `ngay_diem_danh` date DEFAULT NULL,
  `trang_thai` enum('Có mặt','Vắng mặt','Đi muộn') DEFAULT NULL,
  `ghi_chu` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sinh_vien_id` (`sinh_vien_id`),
  KEY `mon_hoc_id` (`mon_hoc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng hocky_namhoc
CREATE TABLE IF NOT EXISTS `hocky_namhoc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hoc_ky` varchar(20) NOT NULL,
  `nam_hoc` varchar(20) NOT NULL,
  `ngay_bat_dau` date NOT NULL,
  `ngay_ket_thuc` date NOT NULL,
  `trang_thai` enum('Hoạt động','Kết thúc') DEFAULT 'Hoạt động',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng lichhoc
CREATE TABLE IF NOT EXISTS `lichhoc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mon_hoc_id` int(11) DEFAULT NULL,
  `phong_hoc` varchar(20) DEFAULT NULL,
  `thu` enum('Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật') DEFAULT NULL,
  `tiet_bat_dau` int(11) DEFAULT NULL,
  `so_tiet` int(11) DEFAULT NULL,
  `loai_tiet` enum('lyThuyet','thucHanh') DEFAULT NULL,
  `buoi_hoc` enum('Sáng','Chiều','Tối') DEFAULT NULL,
  `hoc_ky` varchar(20) DEFAULT NULL,
  `nam_hoc` varchar(20) DEFAULT NULL,
  `so_luong_toi_da` int(11) DEFAULT 50,
  `so_luong_da_dang_ky` int(11) DEFAULT 0,
  `lich_hoc_kha_dung_id` int(11) DEFAULT NULL,
  `sinh_vien_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mon_hoc_id` (`mon_hoc_id`),
  KEY `lich_hoc_kha_dung_id` (`lich_hoc_kha_dung_id`),
  KEY `sinh_vien_id` (`sinh_vien_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$
CREATE TRIGGER `check_lich_hoc_trung_lap` BEFORE INSERT ON `lichhoc` FOR EACH ROW 
BEGIN
    DECLARE conflict_count INT;
    SELECT COUNT(*) INTO conflict_count
    FROM `lichhoc`
    WHERE `phong_hoc` = NEW.`phong_hoc`
    AND `thu` = NEW.`thu`
    AND `buoi_hoc` = NEW.`buoi_hoc`
    AND (
        (NEW.`tiet_bat_dau` BETWEEN `tiet_bat_dau` AND (`tiet_bat_dau` + `so_tiet` - 1))
        OR
        ((NEW.`tiet_bat_dau` + NEW.`so_tiet` - 1) BETWEEN `tiet_bat_dau` AND (`tiet_bat_dau` + `so_tiet` - 1))
    );
    IF conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Phòng học đã được sử dụng trong khung giờ này';
    END IF;
    IF NEW.`loai_tiet` = 'thucHanh' AND NEW.`so_tiet` > 3 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số tiết thực hành tối đa là 3 tiết/buổi';
    END IF;
END$$

CREATE TRIGGER `check_so_tiet_mon_hoc` BEFORE INSERT ON `lichhoc` FOR EACH ROW 
BEGIN
    DECLARE tin_chi INT;
    DECLARE ly_thuyet INT;
    DECLARE thuc_hanh INT;
    SELECT `so_tin_chi` INTO tin_chi
    FROM `monhoc`
    WHERE `id` = NEW.`mon_hoc_id`;
    SELECT COALESCE(SUM(CASE WHEN `loai_tiet` = 'lyThuyet' THEN `so_tiet` ELSE 0 END), 0),
           COALESCE(SUM(CASE WHEN `loai_tiet` = 'thucHanh' THEN `so_tiet` ELSE 0 END), 0)
    INTO ly_thuyet, thuc_hanh
    FROM `lichhoc`
    WHERE `mon_hoc_id` = NEW.`mon_hoc_id`;
    IF NEW.`loai_tiet` = 'lyThuyet' THEN
        SET ly_thuyet = ly_thuyet + NEW.`so_tiet`;
    ELSEIF NEW.`loai_tiet` = 'thucHanh' THEN
        SET thuc_hanh = thuc_hanh + NEW.`so_tiet`;
    END IF;
    IF ly_thuyet > (tin_chi * 15) OR thuc_hanh > (tin_chi * 15) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tổng số tiết vượt quá quy định (1 tín chỉ = 15 tiết lý thuyết + 15 tiết thực hành)';
    END IF;
END$$
DELIMITER ;

-- Tạo bảng nhom_thuc_hanh
CREATE TABLE IF NOT EXISTS `nhom_thuc_hanh` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lichhoc_id` int(11) NOT NULL,
  `ten_nhom` varchar(20) NOT NULL,
  `so_luong_toi_da` int(11) DEFAULT 25,
  PRIMARY KEY (`id`),
  KEY `lichhoc_id` (`lichhoc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng phannhom_sinhvien
CREATE TABLE IF NOT EXISTS `phannhom_sinhvien` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sinh_vien_id` int(11) NOT NULL,
  `nhom_thuc_hanh_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sinh_vien_id` (`sinh_vien_id`),
  KEY `nhom_thuc_hanh_id` (`nhom_thuc_hanh_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng phanconggiangday
CREATE TABLE IF NOT EXISTS `phanconggiangday` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `giang_vien_id` int(11) DEFAULT NULL,
  `mon_hoc_id` int(11) DEFAULT NULL,
  `hoc_ky` varchar(20) DEFAULT NULL,
  `nam_hoc` varchar(20) DEFAULT NULL,
  `ngay_phan_cong` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `giang_vien_id` (`giang_vien_id`),
  KEY `mon_hoc_id` (`mon_hoc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng lichgiangday
CREATE TABLE IF NOT EXISTS `lichgiangday` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `phan_cong_id` int(11) DEFAULT NULL,
  `phong_hoc` varchar(20) DEFAULT NULL,
  `thu` enum('Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật') DEFAULT NULL,
  `tiet_bat_dau` int(11) DEFAULT NULL,
  `so_tiet` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `phan_cong_id` (`phan_cong_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng tuan_hoc
CREATE TABLE IF NOT EXISTS `tuan_hoc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hocky_namhoc_id` int(11) NOT NULL,
  `tuan_thu` int(11) NOT NULL,
  `ngay_bat_dau` date NOT NULL,
  `ngay_ket_thuc` date NOT NULL,
  `trang_thai` enum('Học','Nghỉ') DEFAULT 'Học',
  `ghi_chu` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `hocky_namhoc_id` (`hocky_namhoc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng kehoach_giangday
CREATE TABLE IF NOT EXISTS `kehoach_giangday` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lichhoc_id` int(11) NOT NULL,
  `tuan_hoc_id` int(11) NOT NULL,
  `loai_tiet` enum('lyThuyet','thucHanh') NOT NULL,
  `nhom_thuc_hanh` int(11) DEFAULT NULL,
  `noi_dung` text DEFAULT NULL,
  `ghi_chu` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lichhoc_id` (`lichhoc_id`),
  KEY `tuan_hoc_id` (`tuan_hoc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng ketquahoctap
CREATE TABLE IF NOT EXISTS `ketquahoctap` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `hoc_ky` varchar(20) DEFAULT NULL,
  `nam_hoc` varchar(20) DEFAULT NULL,
  `diem_trung_binh` float DEFAULT NULL,
  `tong_tin_chi_dat` int(11) DEFAULT NULL,
  `trang_thai` enum('Đạt','Không đạt') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sinh_vien_id` (`sinh_vien_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng khoaluandoan
CREATE TABLE IF NOT EXISTS `khoaluandoan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `giang_vien_huong_dan_id` int(11) DEFAULT NULL,
  `ten_de_tai` varchar(200) NOT NULL,
  `mo_ta` text DEFAULT NULL,
  `thoi_gian_bat_dau` date DEFAULT NULL,
  `thoi_gian_ket_thuc` date DEFAULT NULL,
  `diem_so` float DEFAULT NULL,
  `trang_thai` enum('Đang thực hiện','Đã bảo vệ','Chưa hoàn thành') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sinh_vien_id` (`sinh_vien_id`),
  KEY `giang_vien_huong_dan_id` (`giang_vien_huong_dan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng lichsudangky
CREATE TABLE IF NOT EXISTS `lichsudangky` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `thoi_gian` datetime NOT NULL,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `mon_hoc_id` int(11) DEFAULT NULL,
  `hanh_dong` varchar(50) NOT NULL,
  `ket_qua` varchar(50) NOT NULL,
  `chi_tiet` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sinh_vien_id` (`sinh_vien_id`),
  KEY `mon_hoc_id` (`mon_hoc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng lichsudangnhap
CREATE TABLE IF NOT EXISTS `lichsudangnhap` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `taikhoan_id` int(11) NOT NULL,
  `thoi_gian` datetime DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `trang_thai` enum('Thành công','Thất bại') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `taikhoan_id` (`taikhoan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$
CREATE TRIGGER `update_last_login` AFTER INSERT ON `lichsudangnhap` FOR EACH ROW 
BEGIN
    IF NEW.trang_thai = 'Thành công' THEN
        UPDATE `taikhoan` SET `lan_dang_nhap_cuoi` = NEW.`thoi_gian` WHERE `id` = NEW.`taikhoan_id`;
    END IF;
END$$
DELIMITER ;

-- Tạo bảng lich_hoc_kha_dung
CREATE TABLE IF NOT EXISTS `lich_hoc_kha_dung` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mon_hoc_id` int(11) DEFAULT NULL,
  `phong_hoc` varchar(20) DEFAULT NULL,
  `thu` enum('Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật') DEFAULT NULL,
  `tiet_bat_dau` int(11) DEFAULT NULL,
  `so_tiet` int(11) DEFAULT NULL,
  `buoi_hoc` enum('Sáng','Chiều','Tối') DEFAULT NULL,
  `hoc_ky` varchar(20) DEFAULT NULL,
  `nam_hoc` varchar(20) DEFAULT NULL,
  `so_luong_toi_da` int(11) DEFAULT 50,
  `so_luong_da_dang_ky` int(11) DEFAULT 0,
  `loai_tiet` enum('lyThuyet','thucHanh') NOT NULL DEFAULT 'lyThuyet',
  PRIMARY KEY (`id`),
  KEY `mon_hoc_id` (`mon_hoc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng sinhvien_lichhoc
CREATE TABLE IF NOT EXISTS `sinhvien_lichhoc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `lich_hoc_id` int(11) DEFAULT NULL,
  `ngay_dang_ky` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sinh_vien_id` (`sinh_vien_id`),
  KEY `lich_hoc_id` (`lich_hoc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng quanlydiem
CREATE TABLE IF NOT EXISTS `quanlydiem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `mon_hoc_id` int(11) DEFAULT NULL,
  `diem_chuyen_can` float DEFAULT NULL,
  `diem_giua_ky` float DEFAULT NULL,
  `diem_cuoi_ky` float DEFAULT NULL,
  `diem_tong_ket` float DEFAULT NULL,
  `hoc_ky` varchar(20) DEFAULT NULL,
  `nam_hoc` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sinh_vien_id` (`sinh_vien_id`),
  KEY `mon_hoc_id` (`mon_hoc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng nghiencuukhoahoc
CREATE TABLE IF NOT EXISTS `nghiencuukhoahoc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ten_de_tai` varchar(200) NOT NULL,
  `mo_ta` text DEFAULT NULL,
  `thoi_gian_bat_dau` date DEFAULT NULL,
  `thoi_gian_ket_thuc` date DEFAULT NULL,
  `trang_thai` enum('Đang thực hiện','Đã hoàn thành','Đã hủy') DEFAULT NULL,
  `kinh_phi` decimal(10,2) DEFAULT NULL,
  `ket_qua` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng thanhviennghiencuu
CREATE TABLE IF NOT EXISTS `thanhviennghiencuu` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nghien_cuu_id` int(11) DEFAULT NULL,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `giang_vien_id` int(11) DEFAULT NULL,
  `vai_tro` varchar(50) DEFAULT NULL,
  `ngay_tham_gia` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `nghien_cuu_id` (`nghien_cuu_id`),
  KEY `sinh_vien_id` (`sinh_vien_id`),
  KEY `giang_vien_id` (`giang_vien_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng phien_lam_viec
CREATE TABLE IF NOT EXISTS `phien_lam_viec` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `taikhoan_id` int(11) NOT NULL,
  `session_token` varchar(100) NOT NULL,
  `thoi_gian_bat_dau` datetime DEFAULT CURRENT_TIMESTAMP,
  `thoi_gian_het_han` datetime DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `trang_thai` enum('Hoạt động','Đã kết thúc','Hết hạn') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `taikhoan_id` (`taikhoan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng tailieugiangday
CREATE TABLE IF NOT EXISTS `tailieugiangday` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mon_hoc_id` int(11) DEFAULT NULL,
  `ten_tai_lieu` varchar(200) NOT NULL,
  `mo_ta` text DEFAULT NULL,
  `duong_dan` varchar(255) DEFAULT NULL,
  `loai_tai_lieu` varchar(50) DEFAULT NULL,
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `mon_hoc_id` (`mon_hoc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng thanhtoanhocphi
CREATE TABLE IF NOT EXISTS `thanhtoanhocphi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `hoc_ky` varchar(20) DEFAULT NULL,
  `nam_hoc` varchar(20) DEFAULT NULL,
  `so_tien` decimal(10,2) DEFAULT NULL,
  `ngay_thanh_toan` datetime DEFAULT NULL,
  `phuong_thuc_thanh_toan` varchar(50) DEFAULT NULL,
  `trang_thai` enum('Đã thanh toán','Chưa thanh toán','Thanh toán một phần') DEFAULT NULL,
  `ghi_chu` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sinh_vien_id` (`sinh_vien_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng thoigiandangky
CREATE TABLE IF NOT EXISTS `thoigiandangky` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hoc_ky` varchar(20) DEFAULT NULL,
  `nam_hoc` varchar(20) DEFAULT NULL,
  `thoi_gian_bat_dau` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `thoi_gian_ket_thuc` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `trang_thai` enum('Hoạt động','Kết thúc','Chưa bắt đầu') DEFAULT 'Chưa bắt đầu',
  `mo_ta` text DEFAULT NULL,
  `hocky_namhoc_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `hocky_namhoc_id` (`hocky_namhoc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng thongbao
CREATE TABLE IF NOT EXISTS `thongbao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tieu_de` varchar(200) NOT NULL,
  `noi_dung` text DEFAULT NULL,
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  `nguoi_tao` varchar(100) DEFAULT NULL,
  `doi_tuong` enum('Tất cả','Sinh viên','Giảng viên') DEFAULT NULL,
  `trang_thai` enum('Đã đăng','Nháp','Đã gỡ') DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng thongbaogiangvien
CREATE TABLE IF NOT EXISTS `thongbaogiangvien` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `giang_vien_id` int(11) DEFAULT NULL,
  `tieu_de` varchar(200) NOT NULL,
  `noi_dung` text DEFAULT NULL,
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  `doi_tuong` varchar(100) DEFAULT NULL,
  `trang_thai` enum('Đã đăng','Nháp','Đã gỡ') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `giang_vien_id` (`giang_vien_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng thongbao_taikhoan
CREATE TABLE IF NOT EXISTS `thongbao_taikhoan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `taikhoan_id` int(11) NOT NULL,
  `tieu_de` varchar(200) NOT NULL,
  `noi_dung` text DEFAULT NULL,
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  `da_doc` tinyint(1) DEFAULT 0,
  `loai_thong_bao` enum('Hệ thống','Bảo mật','Thông tin') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `taikhoan_id` (`taikhoan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng system_settings
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_description` text DEFAULT NULL,
  `setting_group` varchar(50) DEFAULT 'general',
  `is_editable` tinyint(1) DEFAULT 1,
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `setting_description`, `setting_group`) VALUES
('school_name', 'Trường Đại học', 'Tên trường đại học', 'general'),
('academic_year', '2023-2024', 'Năm học hiện tại', 'academic'),
('max_courses_per_semester', '5', 'Số môn học tối đa mỗi học kỳ', 'registration'),
('enable_registration', 'true', 'Cho phép đăng ký học phần', 'registration'),
('system_maintenance_mode', 'false', 'Chế độ bảo trì hệ thống', 'system');

-- Tạo bảng reports
CREATE TABLE IF NOT EXISTS `reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `report_name` varchar(100) NOT NULL,
  `report_type` enum('Sinh viên','Giảng viên','Học phí','Điểm số','Khác') NOT NULL,
  `report_query` text DEFAULT NULL,
  `parameters` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_run` datetime DEFAULT NULL,
  `is_scheduled` tinyint(1) DEFAULT 0,
  `schedule_frequency` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `reports` (`report_name`, `report_type`, `report_query`, `parameters`) VALUES
('Danh sách sinh viên theo lớp', 'Sinh viên', 'SELECT s.*, l.ten_lop FROM sinhvien s JOIN lop l ON s.lop_id = l.id WHERE l.id = :lop_id', '{"lop_id":"required"}'),
('Thống kê điểm trung bình theo lớp', 'Điểm số', 'SELECT l.ten_lop, AVG(q.diem_tong_ket) as diem_tb FROM quanlydiem q JOIN sinhvien s ON q.sinh_vien_id = s.id JOIN lop l ON s.lop_id = l.id WHERE q.hoc_ky = :hoc_ky AND q.nam_hoc = :nam_hoc GROUP BY l.id', '{"hoc_ky":"required","nam_hoc":"required"}'),
('Báo cáo học phí chưa thanh toán', 'Học phí', 'SELECT s.ho_ten, l.ten_lop, t.so_tien, t.ngay_thanh_toan FROM thanhtoanhocphi t JOIN sinhvien s ON t.sinh_vien_id = s.id JOIN lop l ON s.lop_id = l.id WHERE t.trang_thai = "Chưa thanh toán"', '{}');

-- Tạo view dashboard_stats
CREATE OR REPLACE VIEW `dashboard_stats` AS
SELECT
  (SELECT COUNT(*) FROM `sinhvien` WHERE `trang_thai` = 'Đang học') AS total_active_students,
  (SELECT COUNT(*) FROM `giangvien` WHERE `trang_thai` = 'Đang dạy') AS total_active_faculty,
  (SELECT COUNT(*) FROM `monhoc`) AS total_courses,
  (SELECT COUNT(*) FROM `lop`) AS total_classes,
  (SELECT COUNT(*) FROM `dangkyhocphan` WHERE `trang_thai` = 'Đăng ký') AS pending_registrations,
  (SELECT COUNT(*) FROM `dangkyhocphan` WHERE `trang_thai` = 'Đã duyệt') AS approved_registrations;

-- Thêm các ràng buộc khóa ngoại
ALTER TABLE `lop`
  ADD CONSTRAINT `lop_ibfk_4` FOREIGN KEY (`khoa_id`) REFERENCES `khoa` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lop_ibfk_5` FOREIGN KEY (`co_van_id`) REFERENCES `giangvien` (`id`) ON DELETE SET NULL;

ALTER TABLE `sinhvien`
  ADD CONSTRAINT `sinhvien_ibfk_1` FOREIGN KEY (`lop_id`) REFERENCES `lop` (`id`) ON DELETE SET NULL;

ALTER TABLE `monhoc`
  ADD CONSTRAINT `monhoc_ibfk_1` FOREIGN KEY (`mon_hoc_tien_quyet`) REFERENCES `monhoc` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `monhoc_ibfk_2` FOREIGN KEY (`ma_nganh`) REFERENCES `nganh` (`ma_nganh`) ON DELETE SET NULL;

ALTER TABLE `taikhoan`
  ADD CONSTRAINT `taikhoan_ibfk_1` FOREIGN KEY (`quyen_han_id`) REFERENCES `quyenhan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `taikhoan_ibfk_2` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `taikhoan_ibfk_3` FOREIGN KEY (`giang_vien_id`) REFERENCES `giangvien` (`id`) ON DELETE CASCADE;

ALTER TABLE `cauhinh_taikhoan`
  ADD CONSTRAINT `cauhinh_taikhoan_ibfk_1` FOREIGN KEY (`taikhoan_id`) REFERENCES `taikhoan` (`id`) ON DELETE CASCADE;

ALTER TABLE `chitiet_monhoc`
  ADD CONSTRAINT `chitiet_monhoc_ibfk_1` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`) ON DELETE CASCADE;

ALTER TABLE `dangkyhocphan`
  ADD CONSTRAINT `dangkyhocphan_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dangkyhocphan_ibfk_2` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`) ON DELETE CASCADE;

ALTER TABLE `dethi`
  ADD CONSTRAINT `dethi_ibfk_1` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dethi_giangvien_ibfk_2` FOREIGN KEY (`giang_vien`) REFERENCES `giangvien` (`ma_gv`) ON DELETE SET NULL;

ALTER TABLE `diemdanh`
  ADD CONSTRAINT `diemdanh_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `diemdanh_ibfk_2` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`) ON DELETE CASCADE;

ALTER TABLE `lichhoc`
  ADD CONSTRAINT `lichhoc_ibfk_1` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lichhoc_ibfk_2` FOREIGN KEY (`lich_hoc_kha_dung_id`) REFERENCES `lich_hoc_kha_dung` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `lichhoc_ibfk_3` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`) ON DELETE CASCADE;

ALTER TABLE `nhom_thuc_hanh`
  ADD CONSTRAINT `nhom_thuc_hanh_ibfk_1` FOREIGN KEY (`lichhoc_id`) REFERENCES `lichhoc` (`id`) ON DELETE CASCADE;

ALTER TABLE `phannhom_sinhvien`
  ADD CONSTRAINT `phannhom_sinhvien_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `phannhom_sinhvien_ibfk_2` FOREIGN KEY (`nhom_thuc_hanh_id`) REFERENCES `nhom_thuc_hanh` (`id`) ON DELETE CASCADE;

ALTER TABLE `phanconggiangday`
  ADD CONSTRAINT `phanconggiangday_ibfk_1` FOREIGN KEY (`giang_vien_id`) REFERENCES `giangvien` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `phanconggiangday_ibfk_2` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`) ON DELETE CASCADE;

ALTER TABLE `lichgiangday`
  ADD CONSTRAINT `lichgiangday_ibfk_1` FOREIGN KEY (`phan_cong_id`) REFERENCES `phanconggiangday` (`id`) ON DELETE CASCADE;

ALTER TABLE `tuan_hoc`
  ADD CONSTRAINT `tuan_hoc_ibfk_1` FOREIGN KEY (`hocky_namhoc_id`) REFERENCES `hocky_namhoc` (`id`) ON DELETE CASCADE;

ALTER TABLE `kehoach_giangday`
  ADD CONSTRAINT `kehoach_giangday_ibfk_1` FOREIGN KEY (`lichhoc_id`) REFERENCES `lichhoc` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kehoach_giangday_ibfk_2` FOREIGN KEY (`tuan_hoc_id`) REFERENCES `tuan_hoc` (`id`) ON DELETE CASCADE;

ALTER TABLE `ketquahoctap`
  ADD CONSTRAINT `ketquahoctap_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`) ON DELETE CASCADE;

ALTER TABLE `khoaluandoan`
  ADD CONSTRAINT `khoaluandoan_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `khoaluandoan_ibfk_2` FOREIGN KEY (`giang_vien_huong_dan_id`) REFERENCES `giangvien` (`id`) ON DELETE SET NULL;

ALTER TABLE `lichsudangky`
  ADD CONSTRAINT `lichsudangky_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lichsudangky_ibfk_2` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`) ON DELETE CASCADE;

ALTER TABLE `lichsudangnhap`
  ADD CONSTRAINT `lichsudangnhap_ibfk_1` FOREIGN KEY (`taikhoan_id`) REFERENCES `taikhoan` (`id`) ON DELETE CASCADE;

ALTER TABLE `lich_hoc_kha_dung`
  ADD CONSTRAINT `lichhockhadung_ibfk_1` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`) ON DELETE CASCADE;

ALTER TABLE `sinhvien_lichhoc`
  ADD CONSTRAINT `sinhvien_lichhoc_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sinhvien_lichhoc_ibfk_2` FOREIGN KEY (`lich_hoc_id`) REFERENCES `lichhoc` (`id`) ON DELETE CASCADE;

ALTER TABLE `quanlydiem`
  ADD CONSTRAINT `quanlydiem_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quanlydiem_ibfk_2` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`) ON DELETE CASCADE;

ALTER TABLE `thanhviennghiencuu`
  ADD CONSTRAINT `thanhviennghiencuu_ibfk_1` FOREIGN KEY (`nghien_cuu_id`) REFERENCES `nghiencuukhoahoc` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `thanhviennghiencuu_ibfk_2` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `thanhviennghiencuu_ibfk_3` FOREIGN KEY (`giang_vien_id`) REFERENCES `giangvien` (`id`) ON DELETE CASCADE;

ALTER TABLE `phien_lam_viec`
  ADD CONSTRAINT `phien_lam_viec_ibfk_1` FOREIGN KEY (`taikhoan_id`) REFERENCES `taikhoan` (`id`) ON DELETE CASCADE;

ALTER TABLE `tailieugiangday`
  ADD CONSTRAINT `tailieugiangday_ibfk_1` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`) ON DELETE CASCADE;

ALTER TABLE `thanhtoanhocphi`
  ADD CONSTRAINT `thanhtoanhocphi_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`) ON DELETE CASCADE;

ALTER TABLE `thoigiandangky`
  ADD CONSTRAINT `thoigiandangky_ibfk_1` FOREIGN KEY (`hocky_namhoc_id`) REFERENCES `hocky_namhoc` (`id`) ON DELETE SET NULL;

ALTER TABLE `thongbaogiangvien`
  ADD CONSTRAINT `thongbaogiangvien_ibfk_1` FOREIGN KEY (`giang_vien_id`) REFERENCES `giangvien` (`id`) ON DELETE CASCADE;

ALTER TABLE `thongbao_taikhoan`
  ADD CONSTRAINT `thongbao_taikhoan_ibfk_1` FOREIGN KEY (`taikhoan_id`) REFERENCES `taikhoan` (`id`) ON DELETE CASCADE;

-- Bật lại kiểm tra khóa ngoại
SET FOREIGN_KEY_CHECKS = 1;

COMMIT;